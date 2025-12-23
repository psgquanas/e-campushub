import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { validateMaterialCreate } from "@/lib/validation";
import aj, { slidingWindow } from "@/lib/arcjet";

export async function POST(req: NextRequest) {
  const arcjet = aj.withRule(
    slidingWindow({
      mode: "LIVE",
      interval: "30m",
      max: 5,
    })
  );

  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const fingerprint =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    const decision = await arcjet.protect(req, { fingerprint });

    if (decision.isDenied()) {
      if (decision.reason.type === "RATE_LIMIT") {
        return NextResponse.json(
          {
            message: "Too many attempts. Try again in a few minutes.",
          },
          { status: 429 }
        );
      }
      return NextResponse.json({ message: "Request blocked" }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    const validation = validateMaterialCreate(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      title,
      description,
      type,
      fileUrl,
      fileKey,
      fileName,
      fileSize,
      mimeType,
      courseId,
      tags,
      academicYear,
    } = validation.data;

    // Verify course exists and user has access to it
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { programme: true },
    });

    if (!user?.programmeId) {
      return NextResponse.json(
        { error: "User programme not set" },
        { status: 400 }
      );
    }

    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        programmeId: user.programmeId,
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: "Course not found or access denied" },
        { status: 404 }
      );
    }

    // Create material record
    const isAdmin = user.role === "ADMIN";
    const material = await prisma.courseMaterial.create({
      data: {
        title,
        description: description || null,
        type,
        fileUrl,
        fileKey,
        fileName,
        fileSize,
        mimeType,
        courseId,
        uploadedBy: session.user.id,
        tags: tags || [],
        academicYear: academicYear || null,
        isVerified: isAdmin, // Admins are auto-verified
        verifiedBy: isAdmin ? session.user.id : null,
        verifiedAt: isAdmin ? new Date() : null,
      },
      include: {
        course: {
          select: {
            code: true,
            name: true,
          },
        },
        uploader: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      material,
      message: isAdmin
        ? "Material uploaded and verified successfully."
        : "Material uploaded successfully. Pending admin approval.",
    });
  } catch (error) {
    console.error("Material creation error:", error);
    return NextResponse.json(
      { error: "Failed to create material record" },
      { status: 500 }
    );
  }
}
