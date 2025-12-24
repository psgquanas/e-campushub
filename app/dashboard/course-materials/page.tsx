import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CourseMaterialsClient from "./CourseMaterials";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Course Materials",
  description: "COurse Materials",
};

export default async function CourseMaterialsPage({
  searchParams,
}: {
  searchParams: {
    level?: string;
    semester?: string;
    course?: string;
    type?: string;
  };
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { programme: true },
  });

  // Get courses for user's programme and level
  const courses = await prisma.course.findMany({
    where: {
      programmeId: user?.programmeId!,
      level: user?.currentLevel!,
    },
    include: {
      materials: {
        where: {
          isVerified: true, // Only show verified materials
        },
        include: {
          uploader: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  return (
    <div className="flex h-full flex-col">
      <CourseMaterialsClient
        courses={courses}
        userLevel={user?.currentLevel!}
        userId={session.user.id}
      />
    </div>
  );
}
