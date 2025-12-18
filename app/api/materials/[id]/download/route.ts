import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import { awardPoints } from "@/lib/point";

const s3 = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true, // Needed for Tigris/MinIO
});

export async function GET(
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

    // Get material from database with course info
    const material = await prisma.courseMaterial.findUnique({
      where: { id: materialId },
      include: {
        course: true,
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    // Authorization Check:
    // User must be ADMIN OR belong to the same programme as the course
    const isAdmin = session.user.role === "ADMIN";
    const isSameProgramme =
      session.user.programmeId === material.course.programmeId;

    if (!isAdmin && !isSameProgramme) {
      return NextResponse.json(
        {
          error:
            "Forbidden: You can only download materials for your programme",
        },
        { status: 403 }
      );
    }

    // Increment download count
    await prisma.courseMaterial.update({
      where: { id: materialId },
      data: { downloads: { increment: 1 } },
    });

    // Fetch file from S3 using SDK
    const command = new GetObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES,
      Key: material.fileKey,
    });

    const s3Response = await s3.send(command);

    if (!s3Response.Body) {
      throw new Error("Failed to fetch file stream from storage");
    }

    // Convert the stream to a Web ReadableStream
    const stream = s3Response.Body.transformToWebStream();

    await awardPoints({
      userId: material.uploadedBy,
      action: "MATERIAL_DOWNLOADED",
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": material.mimeType,
        "Content-Disposition": `attachment; filename="${material.fileName}"`,
        "Content-Length": material.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    return NextResponse.json(
      { error: "Failed to download file" },
      { status: 500 }
    );
  }
}
