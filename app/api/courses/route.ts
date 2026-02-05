import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        programmeId: true,
        currentLevel: true,
      },
    });

    if (!user || user.programmeId === null) {
      return NextResponse.json([]);
    }

    const courses = await prisma.course.findMany({
      where: {
        programmeId: user.programmeId,
        level: user.currentLevel || undefined,
      },
      orderBy: [{ level: "asc" }, { code: "asc" }],
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
