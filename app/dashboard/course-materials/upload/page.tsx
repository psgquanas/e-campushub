import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UploadMaterialForm from "./Upload";

export default async function UploadMaterialPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { programme: true },
  });

  if (!user?.programmeId || !user?.currentLevel) {
    redirect("/onboarding");
  }

  // Get courses for user's programme and level
  const courses = await prisma.course.findMany({
    where: {
      programmeId: user.programmeId,
      level: user.currentLevel,
    },
    orderBy: [{ semester: "asc" }, { code: "asc" }],
  });

  return (
    <div className="container max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload Course Material</h1>
        <p className="text-muted-foreground">
          Share notes, slides, and other study materials with your peers
        </p>
      </div>

      <UploadMaterialForm courses={courses} userId={session.user.id} />
    </div>
  );
}
