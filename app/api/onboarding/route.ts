import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { awardPoints } from "@/lib/point";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id;

    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { programmeId, currentLevel } = await req.json();

    if (!programmeId || !currentLevel)
      return NextResponse.json(
        { error: "Missing programmeId or currentLevel" },
        { status: 400 }
      );

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        programmeId: Number(programmeId),
        currentLevel: Number(currentLevel),
      },
      include: { programme: true },
    });

    // Award points for completing profile
    await awardPoints({
      userId,
      action: "PROFILE_COMPLETED",
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
