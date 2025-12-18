import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import aj, { slidingWindow } from "@/lib/arcjet";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "60m",
      max: 100,
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
    const userId = session.user.id;

    console.log("[COMMENT_LIKE] Toggling like for:", { commentId, userId });

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId,
        },
      },
    });

    if (existingLike) {
      console.log("[COMMENT_LIKE] Removing like:", existingLike.id);
      await prisma.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      console.log("[COMMENT_LIKE] Creating like");
      await prisma.commentLike.create({
        data: {
          commentId,
          userId,
        },
      });
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[COMMENT_LIKE] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
