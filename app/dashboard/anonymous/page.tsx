import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import AnonymousClient from "./AnonymousClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Anonymous",
  description: "Anonymous Confessions",
};

export default async function AnonymousPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Check if user is admin
  const userIsAdmin = await isAdmin(session.user.id);

  // Get confessions with engagement data
  const confessions = await prisma.confession.findMany({
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
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="container max-w-5xl py-8">
      <AnonymousClient
        initialConfessions={confessions}
        currentUser={{
          id: session.user.id,
          name: session.user.name,
          image: session.user.image || null,
        }}
        isAdmin={userIsAdmin}
      />
    </div>
  );
}
