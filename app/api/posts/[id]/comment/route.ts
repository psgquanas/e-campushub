import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { awardPoints } from "@/lib/point";
import aj, { slidingWindow } from "@/lib/arcjet";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "60m",
      max: 30,
    })
  );

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fingerprint =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const decision = await arcjet.protect(req, { fingerprint });

    if (decision.isDenied()) {
      if (decision.reason.type === "RATE_LIMIT") {
        return NextResponse.json(
          {
            message: "Too many attempts. Try again in a few minutes.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    const { id: postId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    const comment = await prisma.postComment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        likes: true,
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    });

    // Award points
    awardPoints({
      userId: session.user.id,
      action: "COMMENT_CREATED",
    }).catch((err: unknown) => {
      console.error("Failed to award points for comment:", err);
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error("Add comment error:", error);
    return NextResponse.json(
      { error: "Failed to add comment" },
      { status: 500 }
    );
  }
}
