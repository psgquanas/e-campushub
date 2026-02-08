import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { analyzeDocument, generateWithFallback } from "@/lib/gemini";
import arcjet, { slidingWindow } from "@/lib/arcjet";
import { checkBalance, deductPoints, POINT_COSTS } from "@/lib/points";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1m",
          max: 10,
        }),
      )
      .protect(request, { fingerprint: session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { message: "Too many quiz generation requests. Please slow down." },
          { status: 429 },
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    // Check if user has enough points
    const hasEnoughPoints = await checkBalance(
      session.user.id,
      POINT_COSTS.AI_QUIZ_GENERATION,
    );

    if (!hasEnoughPoints) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          message: `You need ${POINT_COSTS.AI_QUIZ_GENERATION} points to generate a quiz. Earn more points by uploading materials, posting, or logging in daily!`,
          required: POINT_COSTS.AI_QUIZ_GENERATION,
        },
        { status: 402 },
      );
    }

    const body = await request.json();
    const { courseId, materialIds, difficulty } = body;

    if (!courseId || !materialIds || materialIds.length === 0) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Fetch materials
    const materials = await prisma.courseMaterial.findMany({
      where: {
        id: { in: materialIds },
      },
    });

    if (materials.length === 0) {
      return new NextResponse("No materials found", { status: 404 });
    }

    // 2. Fetch course name for context
    const course = await prisma.course.findUnique({
      where: { id: parseInt(courseId) },
    });

    // 3. Extract text from each material
    let combinedContext = "";
    for (const material of materials) {
      try {
        const response = await fetch(material.fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const analysis = await analyzeDocument(buffer, material.mimeType);
        combinedContext += `\n--- Material: ${material.title} ---\n${analysis.extractedText}\n`;
      } catch (err) {
        console.error(`Failed to process material ${material.id}:`, err);
      }
    }

    if (!combinedContext.trim()) {
      return new NextResponse("Could not extract any text from materials", {
        status: 422,
      });
    }

    // 4. Generate Quiz using Gemini
    const prompt = `
      You are an expert academic professor. Based on the provided study materials for the course "${course?.name || "General"}", generate a ${difficulty} level quiz.
      
      Study Materials:
      ${combinedContext.substring(0, 30000)} // Truncate to avoid token limits if too large

      Requirements:
      1. Generate 15 multiple-choice questions.
      2. Each question must have 4 options.
      3. Provide a clear explanation for each correct answer.
      4. Difficulty level: ${difficulty}.
      5. Output MUST be a valid JSON object matching this TypeScript interface:
         interface Question {
           question: string;
           options: string[];
           correctAnswer: number; // Index (0-3)
           explanation: string;
         }
         interface QuizOutput {
           title: string;
           questions: Question[];
         }

      DO NOT include any markdown formatting like \`\`\`json. Return ONLY the JSON object.
    `;

    const generation = await generateWithFallback(prompt);

    if (!generation.text) {
      return new NextResponse("AI failed to generate quiz content", {
        status: 500,
      });
    }

    let quizJson;
    try {
      // Clean up potential markdown formatting if Gemini didn't follow instructions
      const cleanedText = generation.text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      quizJson = JSON.parse(cleanedText);
    } catch (err) {
      console.error("Failed to parse Gemini output:", generation.text);
      return new NextResponse("Failed to generate a valid quiz format", {
        status: 500,
      });
    }

    // 5. Save Quiz to Database
    const newQuiz = await prisma.quiz.create({
      data: {
        userId: session.user.id,
        title: quizJson.title || `Quiz on ${materials[0].title}`,
        subject: course?.name || "Multiple Subjects",
        difficulty: difficulty.toLowerCase(),
        questions: quizJson.questions,
        totalPoints: quizJson.questions.length,
        timeLimit: quizJson.questions.length * 60, // 1 minute per question as default
      },
    });

    // 6. Deduct points for quiz generation
    await deductPoints(
      session.user.id,
      POINT_COSTS.AI_QUIZ_GENERATION,
      "AI_QUIZ_GENERATION",
      `Generated ${difficulty} quiz: ${newQuiz.title}`,
    );

    return NextResponse.json(newQuiz);
  } catch (error) {
    console.error("[QUIZ_GENERATE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
