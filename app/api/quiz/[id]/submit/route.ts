import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import arcjet, { slidingWindow } from "@/lib/arcjet";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Apply Arcjet rate limiting to prevent quiz submission abuse
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
          { message: "Too many quiz submissions. Please slow down." },
          { status: 429 },
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    const body = await req.json();
    const { score, totalPoints, userAnswers, timeTaken } = body;

    if (score === undefined || totalPoints === undefined || !userAnswers) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Fetch the quiz to ensure it belongs to the user
    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    if (quiz.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 2. Update the quiz with results
    const updatedQuiz = await prisma.quiz.update({
      where: { id },
      data: {
        score,
        totalPoints,
        percentage: (score / totalPoints) * 100,
        userAnswers,
        timeTaken,
        completed: true,
        completedAt: new Date(),
        attempts: { increment: 1 },
      },
    });

    return NextResponse.json(updatedQuiz);
  } catch (error) {
    console.error("[QUIZ_SUBMIT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
