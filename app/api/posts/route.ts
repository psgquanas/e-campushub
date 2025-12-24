import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { ensureAdmin, isAdmin } from "@/lib/admin";
import aj, { slidingWindow } from "@/lib/arcjet";
import { validatePostCreate } from "@/lib/validation";
import { awardPoints } from "@/lib/point";

export async function POST(req: NextRequest) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "60m",
      max: 10,
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

    // Only admins can create posts
    await ensureAdmin(session.user.id);

    const json = await req.json();
    const result = validatePostCreate(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, imageUrls } = result.data;

    const post = await prisma.post.create({
      data: {
        content,
        imageUrls: imageUrls || [],
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            role: true,
          },
        },
      },
    });

    // Award points for creating a post
    await awardPoints({
      userId: session.user.id,
      action: "POST_CREATED",
    });

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get("sort") || "newest";

    const userIsAdmin = await isAdmin(session.user.id);

    const baseQuery = {
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
          where: {
            parentId: null,
          },
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
                _count: {
                  select: {
                    likes: true,
                    replies: true,
                  },
                },
              },
              orderBy: {
                createdAt: "asc" as const,
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
            createdAt: "asc" as const,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    };

    let posts;

    switch (sortBy) {
      case "popular":
        posts = await prisma.post.findMany({
          ...baseQuery,
          orderBy: [
            { isPinned: "desc" },
            { likes: { _count: "desc" } },
            { createdAt: "desc" },
          ],
        });
        break;
      case "discussed":
        posts = await prisma.post.findMany({
          ...baseQuery,
          orderBy: [
            { isPinned: "desc" },
            { comments: { _count: "desc" } },
            { createdAt: "desc" },
          ],
        });
        break;
      case "trending":
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        posts = await prisma.post.findMany({
          ...baseQuery,
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          orderBy: [{ isPinned: "desc" }, { views: "desc" }],
        });

        if (posts.length < 5) {
          posts = await prisma.post.findMany({
            ...baseQuery,
            orderBy: [
              { isPinned: "desc" },
              { views: "desc" },
              { createdAt: "desc" },
            ],
            take: 20,
          });
        }
        break;
      case "newest":
      default:
        posts = await prisma.post.findMany({
          ...baseQuery,
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        });
        break;
    }

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
