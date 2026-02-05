import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import arcjet, { slidingWindow } from "@/lib/arcjet";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Apply Arcjet rate limiting
    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1m",
          max: 60, // 60 requests per minute
        }),
      )
      .protect(req, { fingerprint: session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    // Get all completed quizzes for the user
    const completedQuizzes = await prisma.quiz.findMany({
      where: {
        userId: session.user.id,
        completed: true,
      },
      select: {
        score: true,
        totalPoints: true,
      },
    });

    // Calculate stats
    const totalQuizzes = completedQuizzes.length;

    let highestScore = 0;
    if (totalQuizzes > 0) {
      const percentages = completedQuizzes.map((quiz) => {
        if (quiz.totalPoints && quiz.totalPoints > 0) {
          return Math.round(((quiz.score || 0) / quiz.totalPoints) * 100);
        }
        return 0;
      });
      highestScore = Math.max(...percentages);
    }

    return NextResponse.json({
      highestScore,
      totalQuizzes,
    });
  } catch (error) {
    console.error("[QUIZ_STATS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
