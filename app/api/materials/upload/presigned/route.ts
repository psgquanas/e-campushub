import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileName, fileType, fileSize } = await req.json();

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX" },
        { status: 400 }
      );
    }

    // Generate unique key
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `materials/${timestamp}-${sanitizedFileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES,
      Key: key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    // Public URL for accessing the file after upload
    const publicUrl = `https://${env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES}.fly.storage.tigris.dev/${key}`;

    return NextResponse.json({
      presignedUrl,
      key,
      publicUrl,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      {
        error: "Failed to generate presigned URL",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
