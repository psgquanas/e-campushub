// app/api/test-upload/route.ts
import { NextResponse } from "next/server";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export async function GET() {
  try {
    const testKey = "test-file.txt";
    const testContent = "Hello from E-Campus Hub!";

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES,
      Key: testKey,
      Body: testContent,
      ContentType: "text/plain",
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: "Upload successful!",
      fileUrl: `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES}.fly.storage.tigris.dev/${testKey}`,
    });
  } catch (error) {
    console.error("Test upload failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
