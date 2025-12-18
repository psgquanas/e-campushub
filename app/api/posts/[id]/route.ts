import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { ensureAdmin } from "@/lib/admin";
import { deleteFile } from "@/lib/s3";
import { validatePostUpdate } from "@/lib/validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Only admins can delete posts
    await ensureAdmin(session.user.id);

    const { id: postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Delete images from S3
    if (post.imageUrls && post.imageUrls.length > 0) {
      await Promise.allSettled(
        post.imageUrls.map(async (url) => {
          try {
            // Extract key from URL
            // URL format: https://bucket-name.fly.storage.tigris.dev/key
            const key = url.split(".fly.storage.tigris.dev/")[1];
            if (key) {
              await deleteFile(key);
            }
          } catch (error) {
            console.error(`Failed to delete image ${url}:`, error);
          }
        })
      );
    }

    // Delete the post (this will cascade delete comments, likes, etc. if configured in schema)
    await prisma.post.delete({
      where: { id: postId },
    });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[POST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id: postId } = await params;
    const json = await request.json();
    const result = validatePostUpdate(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content } = result.data;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Only author can edit post
    if (post.authorId !== session.user.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content.trim(),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
            role: true,
            badgeName: true,
          },
        },
        likes: {
          select: {
            userId: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            likes: {
              select: {
                userId: true,
              },
            },
            replies: {
              include: {
                author: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                  },
                },
                likes: {
                  select: {
                    userId: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc",
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("[POST_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
