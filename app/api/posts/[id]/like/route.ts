import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import aj, { slidingWindow } from "@/lib/arcjet";
import { awardPoints } from "@/lib/point";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "60m",
      max: 100,
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
            error: "Rate limit exceeded",
            message: "Too many attempts. Try again in a few minutes.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Forbidden", message: "Request blocked" },
        { status: 403 }
      );
    }

    const { id: postId } = await params;

    // Check if user already liked the post
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ success: true, liked: false });
    } else {
      // Like
      const like = await prisma.postLike.create({
        data: {
          postId,
          userId: session.user.id,
        },
        include: {
          post: {
            select: {
              authorId: true,
            },
          },
        },
      });

      // Award points to the post author (not the liker)
      await awardPoints({
        userId: like.post.authorId,
        action: "POST_LIKED",
      });

      return NextResponse.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
