import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import arcjet, { slidingWindow } from "@/lib/arcjet";

export async function GET(
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

    // Apply Arcjet rate limiting
    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1m",
          max: 60,
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

    const quiz = await prisma.quiz.findUnique({
      where: { id },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    if (quiz.userId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[QUIZ_GET_SINGLE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
