import { NextRequest, NextResponse } from "next/server";
import { streamGenerateWithFallback } from "@/lib/gemini";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/getSession";
import { env } from "@/lib/env";
import arcjet, { slidingWindow } from "@/lib/arcjet";
import { checkBalance, deductPoints, POINT_COSTS } from "@/lib/points";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1m",
          max: 10,
        }),
      )
      .protect(req, { fingerprint: session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { message: "Too many requests. Please slow down." },
          { status: 429 },
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    // Check if user has enough points
    const hasEnoughPoints = await checkBalance(
      session.user.id,
      POINT_COSTS.AI_CHAT_MESSAGE,
    );

    if (!hasEnoughPoints) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          message: `You need ${POINT_COSTS.AI_CHAT_MESSAGE} points to send a message. Earn more points by uploading materials, posting, or logging in daily!`,
          required: POINT_COSTS.AI_CHAT_MESSAGE,
        },
        { status: 402 },
      );
    }

    const { message, subject, sessionId, documentIds } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    const userId = session.user.id;

    // 1. Get or Create Chat Session
    let chatSession;
    if (sessionId) {
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId },
      });
    }

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId,
          subject: subject || "general",
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });

      // Link pending documents to new session
      if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        await prisma.document.updateMany({
          where: {
            id: { in: documentIds },
            userId,
            sessionId: null, // Only link those not already linked
          },
          data: { sessionId: chatSession.id },
        });
      }
    }

    // 2. Fetch Session Documents
    const documents = sessionId
      ? await prisma.document.findMany({
          where: { sessionId, userId },
          select: {
            fileName: true,
            fileUrl: true,
            fileType: true,
            extractedText: true,
          },
        })
      : [];

    const documentContext =
      documents.length > 0
        ? `\n\nYou have access to the following documents for context:\n${documents.map((d) => `- ${d.fileName} (${d.fileType}): ${d.extractedText ? `\n--- CONTENT START ---\n${d.extractedText}\n--- CONTENT END ---` : "[Content not extractable]"}`).join("\n")}`
        : "";

    // 3. Save User Message
    await prisma.message.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
      },
    });

    const systemPrompt =
      subject && subject !== "general"
        ? `You are an expert AI tutor specializing in ${subject}. Your role is to help students learn effectively by:

- Providing clear, accurate explanations tailored to the student's level
- Breaking down complex concepts into digestible parts
- Using examples, analogies, and visual descriptions when helpful
- Encouraging critical thinking by asking guiding questions
- Offering practice problems and step-by-step solutions when appropriate
- Adapting your teaching style based on the student's responses and needs
- Being patient, supportive, and encouraging
- Admitting when something is outside your expertise and suggesting resources

${documentContext}

Focus on understanding rather than memorization. Help students build intuition and connect concepts to real-world applications.`
        : `You are an expert AI study assistant designed to help students learn more effectively. Your role is to:

- Answer questions clearly and concisely across various subjects
- Help with homework, exam preparation, and concept review
- Provide study strategies and learning techniques
- Break down complex topics into understandable parts
- Offer practice questions and explanations
- Encourage active learning and critical thinking
- Adapt to different learning styles and levels
- Be supportive and patient with struggling students

${documentContext}

When students ask questions, first ensure you understand what they're asking, then provide thorough but accessible explanations. Use examples and analogies to clarify difficult concepts.`;

    const prompt = `${systemPrompt}\n\nStudent question: ${message}`;

    const { stream, modelUsed } = await streamGenerateWithFallback(prompt);

    // 3. Setup Streaming Response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullText = "";
        try {
          // Send sessionId first so frontend can update its state
          const header =
            JSON.stringify({ sessionId: chatSession.id }) + "\n---\n";
          controller.enqueue(encoder.encode(header));

          for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
              fullText += chunkText;
              controller.enqueue(encoder.encode(chunkText));
            }
          }

          // 4. Save Assistant Message after stream completes
          await prisma.message.create({
            data: {
              sessionId: chatSession.id,
              role: "assistant",
              content: fullText,
              model: modelUsed,
            },
          });

          // 5. Update Session Metadata
          await prisma.chatSession.update({
            where: { id: chatSession.id },
            data: {
              lastMessageAt: new Date(),
              messageCount: { increment: 2 },
            },
          });

          // 6. Deduct points for AI chat message
          await deductPoints(
            userId,
            POINT_COSTS.AI_CHAT_MESSAGE,
            "AI_CHAT_MESSAGE",
            `Chat message in ${subject || "general"} session`,
          );

          // 7. Generate title asynchronously for new sessions (don't await)
          if (chatSession.messageCount === 0) {
            fetch(`${env.BETTER_AUTH_URL}/api/chat/generate-title`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: chatSession.id,
                firstMessage: message,
              }),
            }).catch((e) => console.error("Title generation failed:", e));
          }
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat", details: error.message },
      { status: 500 },
    );
  }
}
