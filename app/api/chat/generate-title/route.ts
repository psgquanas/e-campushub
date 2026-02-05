import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

const google = createGoogleGenerativeAI({
  apiKey: env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { sessionId, firstMessage } = await req.json();

    if (!sessionId || !firstMessage) {
      return new Response("Missing required fields", { status: 400 });
    }

    // Verify session exists (ownership already validated when session was created)
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) {
      return new Response("Session not found", { status: 404 });
    }

    // Generate a concise title
    const { text } = await generateText({
      model: google("gemini-2.5-flash-preview-09-2025"),
      prompt: `Generate a concise 3-5 word title for a chat conversation that starts with: "${firstMessage}". 
Only return the title, nothing else. Do not use quotes. Examples: "Python List Comprehensions", "Calculating Derivatives", "Essay Writing Tips"`,
      temperature: 0.3,
    });

    const title = text.trim().replace(/^["']|["']$/g, ""); // Remove quotes if present

    // Update session title
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });

    return Response.json({ success: true, title });
  } catch (error: any) {
    console.error("Title generation error:", error);
    return Response.json(
      { error: "Failed to generate title", details: error.message },
      { status: 500 },
    );
  }
}
