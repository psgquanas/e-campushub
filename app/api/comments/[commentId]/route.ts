import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { validateCommentUpdate } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { commentId } = await params;
    const userId = session.user.id;

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    // Check if user is admin or the comment author
    const isAdmin = session.user.role === "ADMIN";
    const isAuthor = comment.authorId === userId;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the comment (this will cascade delete replies, likes, etc. if configured in schema)
    await prisma.postComment.delete({
      where: { id: commentId },
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[COMMENT_DELETE] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { commentId } = await params;
    const json = await request.json();
    const result = validateCommentUpdate(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content } = result.data;

    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });

    if (!comment) {
      return new NextResponse("Comment not found", { status: 404 });
    }

    if (comment.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedComment = await prisma.postComment.update({
      where: { id: commentId },
      data: { content },
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error("[COMMENT_UPDATE] Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
