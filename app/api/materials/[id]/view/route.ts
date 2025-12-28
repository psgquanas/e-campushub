import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if user has already viewed this material
    const existingView = await prisma.courseMaterialView.findUnique({
      where: {
        materialId_userId: {
          materialId: id,
          userId,
        },
      },
    });

    // If user hasn't viewed this material yet, create view record and increment count
    if (!existingView) {
      await prisma.$transaction([
        // Create view record
        prisma.courseMaterialView.create({
          data: {
            materialId: id,
            userId,
          },
        }),
        // Increment view count
        prisma.courseMaterial.update({
          where: { id },
          data: {
            views: {
              increment: 1,
            },
          },
        }),
      ]);
    }

    // Get updated view count
    const material = await prisma.courseMaterial.findUnique({
      where: { id },
      select: { views: true },
    });

    return NextResponse.json({
      views: material?.views || 0,
      alreadyViewed: !!existingView,
    });
  } catch (error) {
    console.error("Error tracking material view:", error);
    return NextResponse.json(
      { error: "Failed to track view" },
      { status: 500 }
    );
  }
}
