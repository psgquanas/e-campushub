import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { awardPoints } from "@/lib/point";
import aj, { slidingWindow } from "@/lib/arcjet";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "60m",
      max: 30,
    })
  );

  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const fingerprint =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const decision = await arcjet.protect(request, { fingerprint });

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

    const { commentId } = await params;
    const { content } = await request.json();

    if (!content || typeof content !== "string" || !content.trim()) {
      return new NextResponse("Content is required", { status: 400 });
    }

    // Verify parent comment exists
    const parentComment = await prisma.postComment.findUnique({
      where: { id: commentId },
    });

    if (!parentComment) {
      return new NextResponse("Parent comment not found", { status: 404 });
    }

    const reply = await prisma.postComment.create({
      data: {
        content: content.trim(),
        postId: parentComment.postId,
        authorId: session.user.id,
        parentId: commentId,
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
      console.error("Failed to award points for reply:", err);
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("[COMMENT_REPLY]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
