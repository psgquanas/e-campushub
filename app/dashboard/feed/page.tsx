import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import CampusFeedClient from "./CampusFeedClient";

export default async function CampusFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { sort } = await searchParams;
  const sortBy = sort || "newest";

  // Check if user is admin
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

  return (
    <div className="container max-w-5xl py-8">
      <CampusFeedClient
        initialPosts={posts}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          image: session.user.image || null,
        }}
        isAdmin={userIsAdmin}
        initialSort={sortBy}
      />
    </div>
  );
}
