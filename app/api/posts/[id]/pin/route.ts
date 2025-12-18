import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { ensureAdmin } from "@/lib/admin";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only admins can pin posts
    await ensureAdmin(session.user.id);

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: !post.isPinned,
      },
    });

    return NextResponse.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Toggle pin error:", error);
    return NextResponse.json(
      { error: "Failed to toggle pin" },
      { status: 500 }
    );
  }
}
