// app/api/leaderboard/user/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserRank } from "@/lib/point";
import { prisma } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        points: true,
        name: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rank = await getUserRank(userId);

    return NextResponse.json({
      user,
      rank,
    });
  } catch (error) {
    console.error("User rank error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user rank" },
      { status: 500 }
    );
  }
}
