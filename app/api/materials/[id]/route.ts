// app/api/materials/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { deleteFile } from "@/lib/s3";
import { isAdmin } from "@/lib/admin";

export async function DELETE(
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

    const { id: materialId } = await params;

    // Find material and verify ownership
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Only allow uploader or admin to delete
    const isAdminUser = await isAdmin(session.user.id);
    if (material.uploadedBy !== session.user.id && !isAdminUser) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own uploads" },
        { status: 403 }
      );
    }

    // Delete file from S3
    try {
      await deleteFile(material.fileKey);
    } catch (s3Error) {
      console.error("S3 deletion error:", s3Error);
      // Continue with database deletion even if S3 fails
    }

    // Delete from database
    await prisma.courseMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({
      success: true,
      message: "Material deleted successfully",
    });
  } catch (error) {
    console.error("Material deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete material" },
      { status: 500 }
    );
  }
}
