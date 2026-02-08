import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/getSession";
import { prisma } from "@/lib/db";
import { s3Client, getPublicUrl } from "@/lib/s3";
import { analyzeDocument, generateWithFallback } from "@/lib/gemini";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/lib/env";
import mammoth from "mammoth";
import arcjet, { slidingWindow } from "@/lib/arcjet";
import { checkBalance, deductPoints, POINT_COSTS } from "@/lib/points";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for chat docs
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "text/markdown",
];

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decision = await arcjet
      .withRule(
        slidingWindow({
          mode: "LIVE",
          interval: "1m",
          max: 10,
        }),
      )
      .protect(req, { fingerprint: session.user.id });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { message: "Too many file uploads. Please slow down." },
          { status: 429 },
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    // Check if user has enough points
    const hasEnoughPoints = await checkBalance(
      session.user.id,
      POINT_COSTS.AI_DOCUMENT_UPLOAD,
    );

    if (!hasEnoughPoints) {
      return NextResponse.json(
        {
          error: "Insufficient points",
          message: `You need ${POINT_COSTS.AI_DOCUMENT_UPLOAD} points to upload a document. Earn more points by uploading materials, posting, or logging in daily!`,
          required: POINT_COSTS.AI_DOCUMENT_UPLOAD,
        },
        { status: 402 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Max 10MB." },
        { status: 400 },
      );
    }

    // Validate type (simplified for now)
    if (!ALLOWED_FILE_TYPES.includes(file.type) && !file.name.endsWith(".md")) {
      // Allow slightly more for chat
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `chat-docs/${session.user.id}/${timestamp}-${sanitizedFileName}`;

    // Upload to Tigris S3
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_FILES,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream",
    });

    await s3Client.send(command);

    const fileUrl = getPublicUrl(key);

    // Document analysis (Text extraction & Summarization)
    let extractedText = null;
    let summary = null;

    if (
      file.type === "text/plain" ||
      file.type === "text/markdown" ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt")
    ) {
      extractedText = new TextDecoder().decode(bytes);
      console.log("✅ Text file extracted, length:", extractedText.length);
    } else if (
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // docx
      file.type === "application/msword" // doc
    ) {
      console.log("📄 Extracting text from Word document:", file.name);
      try {
        const result = await mammoth.extractRawText({ buffer: buffer });
        extractedText = result.value;
        console.log("✅ Word text extracted, length:", extractedText.length);

        // Optionally, use Gemini to summarize the extracted text
        if (extractedText && extractedText.length > 100) {
          try {
            const { text } = await generateWithFallback(
              `Provide a concise 2-3 sentence summary of this document:\n\n${extractedText.substring(0, 5000)}`,
            );
            summary = text;
          } catch (e) {
            console.error("Summary generation failed:", e);
          }
        }
      } catch (error) {
        console.error("❌ Word extraction failed:", error);
        extractedText = "Text extraction failed for Word document";
      }
    } else if (
      file.type === "application/pdf" ||
      file.type.startsWith("image/")
    ) {
      console.log("🔍 Analyzing document with Gemini:", file.name, file.type);
      try {
        const analysis = await analyzeDocument(buffer, file.type);
        extractedText = analysis.extractedText;
        summary = analysis.summary;
        console.log("✅ Analysis complete:", {
          extractedTextLength: extractedText?.length || 0,
          summaryLength: summary?.length || 0,
          modelUsed: analysis.modelUsed,
        });
      } catch (error) {
        console.error("❌ Gemini analysis failed:", error);
        // Still create the document but mark analysis as failed
        extractedText =
          "Text extraction failed - file uploaded but not analyzed";
      }
    }

    console.log("💾 Saving document to DB:", {
      fileName: file.name,
      hasExtractedText: !!extractedText,
      hasSummary: !!summary,
    });
    // Create Document record
    const document = await prisma.document.create({
      data: {
        userId: session.user.id,
        sessionId: sessionId || null,
        fileName: file.name,
        fileUrl: fileUrl,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        extractedText: extractedText,
        summary: summary,
        status: "ready",
      },
    });

    // Deduct points for document upload
    await deductPoints(
      session.user.id,
      POINT_COSTS.AI_DOCUMENT_UPLOAD,
      "AI_DOCUMENT_UPLOAD",
      `Uploaded document: ${file.name}`,
    );

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileType: document.fileType,
        fileSize: document.fileSize,
      },
    });
  } catch (error: any) {
    console.error("Chat upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message },
      { status: 500 },
    );
  }
}
