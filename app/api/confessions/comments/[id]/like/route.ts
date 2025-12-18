import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if already liked
    const existingLike = await prisma.confessionCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.confessionCommentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.confessionCommentLike.create({
        data: {
          commentId: id,
          userId: session.user.id,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Error toggling comment like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
