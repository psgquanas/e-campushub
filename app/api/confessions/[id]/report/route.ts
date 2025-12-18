import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

const AUTO_HIDE_THRESHOLD = 3; // Hide after 3 reports

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

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    // Check if confession exists
    const confession = await prisma.confession.findUnique({
      where: { id },
      select: { id: true, reportCount: true },
    });

    if (!confession) {
      return NextResponse.json(
        { error: "Confession not found" },
        { status: 404 }
      );
    }

    // Check if user already reported this confession
    const existingReport = await prisma.confessionReport.findUnique({
      where: {
        confessionId_userId: {
          confessionId: id,
          userId,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this confession" },
        { status: 400 }
      );
    }

    // Create report and update confession in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the report
      await tx.confessionReport.create({
        data: {
          confessionId: id,
          userId,
          reason,
        },
      });

      // Increment report count
      const newReportCount = confession.reportCount + 1;

      // Update confession and auto-hide if threshold reached
      const updatedConfession = await tx.confession.update({
        where: { id },
        data: {
          reportCount: newReportCount,
          isHidden: newReportCount >= AUTO_HIDE_THRESHOLD,
        },
        select: {
          reportCount: true,
          isHidden: true,
        },
      });

      return updatedConfession;
    });

    return NextResponse.json({
      success: true,
      reportCount: result.reportCount,
      isHidden: result.isHidden,
      message: result.isHidden
        ? "Confession has been hidden pending review"
        : "Report submitted successfully",
    });
  } catch (error) {
    console.error("Error reporting confession:", error);
    return NextResponse.json(
      { error: "Failed to report confession" },
      { status: 500 }
    );
  }
}
