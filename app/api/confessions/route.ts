import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import aj, { slidingWindow } from "@/lib/arcjet";
import { isAdmin } from "@/lib/admin";
import { validateConfessionCreate } from "@/lib/validation";

type SortOption = "newest" | "popular" | "discussed" | "trending";

// GET - Fetch all confessions with optional sorting
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const userIsAdmin = await isAdmin(session.user.id);

    // Get sort parameter from URL
    const { searchParams } = new URL(req.url);
    const sortBy = (searchParams.get("sort") as SortOption) || "newest";

    // Base query configuration
    const baseQuery = {
      where: userIsAdmin
        ? {} // Admins see all confessions
        : { isHidden: false }, // Regular users only see non-hidden
      include: {
        likes: {
          select: {
            userId: true,
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

    let confessions;

    switch (sortBy) {
      case "popular":
        // Most likes
        confessions = await prisma.confession.findMany({
          ...baseQuery,
          orderBy: [
            { isPinned: "desc" },
            { likes: { _count: "desc" } },
            { createdAt: "desc" },
          ],
        });
        break;

      case "discussed":
        // Most comments
        confessions = await prisma.confession.findMany({
          ...baseQuery,
          orderBy: [
            { isPinned: "desc" },
            { comments: { _count: "desc" } },
            { createdAt: "desc" },
          ],
        });
        break;

      case "trending":
        // Combination: recent + high engagement
        // Get confessions from last 7 days, sorted by total engagement
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        confessions = await prisma.confession.findMany({
          ...baseQuery,
          where: {
            ...baseQuery.where,
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
          orderBy: [{ isPinned: "desc" }, { views: "desc" }],
        });

        // If not enough trending, fall back to all sorted by engagement
        if (confessions.length < 10) {
          confessions = await prisma.confession.findMany({
            ...baseQuery,
            orderBy: [
              { isPinned: "desc" },
              { views: "desc" },
              { createdAt: "desc" },
            ],
            take: 50,
          });
        }
        break;

      case "newest":
      default:
        confessions = await prisma.confession.findMany({
          ...baseQuery,
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        });
        break;
    }

    return NextResponse.json(confessions);
  } catch (error) {
    console.error("Error fetching confessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch confessions" },
      { status: 500 }
    );
  }
}

// POST - Create a new confession with rate limiting
export async function POST(req: NextRequest) {
  // Rate limiting: 10 per hour + 1 per 5 minutes burst protection
  const arcjet = aj
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "60m", // 10 per hour
        max: 10,
      })
    )
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "5m", // 1 per 5 minutes (burst protection)
        max: 1,
      })
    );

  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limit check
    const fingerprint =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      session.user.id; // Fallback to user ID

    const decision = await arcjet.protect(req, { fingerprint });

    if (decision.isDenied()) {
      if (decision.reason.type === "RATE_LIMIT") {
        // Calculate remaining time - use type guard for resetTime
        const resetTime =
          "resetTime" in decision.reason
            ? decision.reason.resetTime
            : undefined;
        const resetInSeconds = resetTime
          ? Math.ceil((resetTime as Date).getTime() / 1000 - Date.now() / 1000)
          : 60;
        const resetInMinutes = Math.ceil(resetInSeconds / 60);

        return NextResponse.json(
          {
            error: "Rate limit exceeded",
            message: `Please wait ${resetInMinutes} minute${
              resetInMinutes > 1 ? "s" : ""
            } before posting again.`,
            retryAfter: resetInSeconds,
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ error: "Request blocked" }, { status: 403 });
    }

    const json = await req.json();
    const result = validateConfessionCreate(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content } = result.data;

    const confession = await prisma.confession.create({
      data: {
        content: content.trim(),
        authorId: session.user.id,
      },
      include: {
        likes: {
          select: {
            userId: true,
          },
        },
        comments: true,
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return NextResponse.json(confession);
  } catch (error) {
    console.error("Error creating confession:", error);
    return NextResponse.json(
      { error: "Failed to create confession" },
      { status: 500 }
    );
  }
}
