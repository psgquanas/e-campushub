import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { programmeId, currentLevel } = await req.json();

    // Validate programmeId and currentLevel
    if (!programmeId || !currentLevel) {
      return NextResponse.json(
        { error: "Programme ID and current level are required" },
        { status: 400 }
      );
    }

    // Validate level is one of the allowed values
    const validLevels = [100, 200, 300, 400];
    const levelNum = parseInt(currentLevel);
    if (!validLevels.includes(levelNum)) {
      return NextResponse.json(
        { error: "Invalid level. Must be 100, 200, 300, or 400" },
        { status: 400 }
      );
    }

    // Verify the programme exists
    const programme = await prisma.programme.findUnique({
      where: { id: parseInt(programmeId) },
    });

    if (!programme) {
      return NextResponse.json({ error: "Invalid programme" }, { status: 400 });
    }

    // Update user with programme and level
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        programmeId: parseInt(programmeId),
        currentLevel: levelNum,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Programme and level updated successfully",
    });
  } catch (error) {
    console.error("Error updating user programme:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
