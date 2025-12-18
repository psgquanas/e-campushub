import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";
import { prisma } from "@/lib/db";

export default async function DashboardIndexPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return redirect("/sign-in");
  }

  // Fetch current user
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      image: true,
      currentLevel: true,
      points: true,
    },
  });

  if (!currentUser) {
    redirect("/sign-in");
  }

  // Fetch user's leaderboard rank and points using the points field
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      image: true,
      currentLevel: true,
      points: true,
    },
    orderBy: {
      points: "desc",
    },
  });

  const userRank = allUsers.findIndex((u) => u.id === session.user.id) + 1;
  const userPoints = currentUser.points;

  // Fetch recent posts (5 most recent)
  const recentPosts = await prisma.post.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      imageUrls: true,
      isPinned: true,
      views: true,
      createdAt: true,
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
        select: {
          id: true,
          content: true,
          createdAt: true,
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
            select: {
              id: true,
              content: true,
              createdAt: true,
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
          },
          _count: {
            select: {
              likes: true,
              replies: true,
            },
          },
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

  // Fetch top 5 leaderboard
  const topLeaderboard = allUsers.slice(0, 5).map((user, index) => ({
    rank: index + 1,
    user: {
      name: user.name,
      image: user.image,
      level: user.currentLevel || 0,
    },
    totalPoints: user.points,
  }));

  // Fetch recent course materials (for user's level, limit 4)
  const recentMaterials = await prisma.courseMaterial.findMany({
    take: 4,
    orderBy: { createdAt: "desc" },
    where: {
      course: {
        level: currentUser.currentLevel || undefined,
      },
    },
    include: {
      course: {
        select: {
          code: true,
        },
      },
    },
  });

  return (
    <DashboardClient
      currentUser={currentUser}
      userRank={userRank}
      userPoints={userPoints}
      recentPosts={recentPosts}
      topLeaderboard={topLeaderboard}
      recentMaterials={recentMaterials}
      isAdmin={session.user.role === "ADMIN"}
    />
  );
}
