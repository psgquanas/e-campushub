import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { ensureAdmin } from "@/lib/admin";
import { createNotification } from "@/lib/notifications";
import { awardPoints } from "@/lib/point";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureAdmin(session.user.id);

    const { id: materialId } = await params;

    // Approve material
    const material = await prisma.courseMaterial.update({
      where: { id: materialId },
      data: {
        isVerified: true,
        verifiedBy: session.user.id,
        verifiedAt: new Date(),
      },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    await awardPoints({
      userId: material.uploadedBy,
      action: "MATERIAL_APPROVED",
    });

    {
      /*// Send notification to uploader
    await createNotification({
      userId: material.uploadedBy,
      type: "MATERIAL_APPROVED",
      title: "Material Approved! 🎉 + 50 points",
      message: `Your upload "${material.title}" for ${material.course.code} has been approved and you earned 50 bonus points!`,
      materialId: material.id,
    }); */
    }

    return NextResponse.json({
      success: true,
      material,
    });
  } catch (error) {
    console.error("Approve material error:", error);
    return NextResponse.json(
      { error: "Failed to approve material" },
      { status: 500 }
    );
  }
}
