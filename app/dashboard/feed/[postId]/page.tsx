import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import CampusFeedClient from "../CampusFeedClient";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) redirect("/sign-in");

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true, role: true },
  });

  if (!currentUser) redirect("/sign-in");

  // Fetch the specific post by ID
  const post = await prisma.post.findUnique({
    where: { id: postId },
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
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: "desc" },
        include: {
          author: {
            select: { id: true, name: true, image: true },
          },
          likes: true,
          replies: {
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
              likes: true,
              _count: {
                select: { likes: true, replies: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
          _count: {
            select: { likes: true, replies: true },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  // If post not found, redirect to feed
  if (!post) redirect("/dashboard/feed");

  return (
    <CampusFeedClient
      initialPosts={[post]}
      currentUser={currentUser}
      isAdmin={currentUser.role === "ADMIN"}
      postId={postId}
    />
  );
}
