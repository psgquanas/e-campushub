import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { ensureAdmin } from "@/lib/admin";
import { deleteFile } from "@/lib/s3";
import { createNotification } from "@/lib/notifications";

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

    // Get material
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: {
        course: {
          select: {
            name: true,
            code: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Send notification before deletion
    await createNotification({
      userId: material.uploadedBy,
      type: "MATERIAL_REJECTED",
      title: "Material Rejected",
      message: `Your upload "${material.title}" for ${material.course.code} was not approved. Please ensure materials meet quality guidelines and try again.`,
    });

    // Delete from S3
    try {
      await deleteFile(material.fileKey);
    } catch (s3Error) {
      console.error("S3 deletion error:", s3Error);
    }

    // Delete from database
    await prisma.courseMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({
      success: true,
      message: "Material rejected and deleted",
    });
  } catch (error) {
    console.error("Reject material error:", error);
    return NextResponse.json(
      { error: "Failed to reject material" },
      { status: 500 }
    );
  }
}
