import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseId = parseInt(id);
    if (isNaN(courseId)) {
      return new NextResponse("Invalid course ID", { status: 400 });
    }

    const materials = await prisma.courseMaterial.findMany({
      where: {
        courseId: courseId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(materials);
  } catch (error) {
    console.error("[COURSE_MATERIALS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
