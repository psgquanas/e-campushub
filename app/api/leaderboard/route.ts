import { NextRequest, NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/point";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "15");
    const programmeId = searchParams.get("programmeId");
    const level = searchParams.get("level");

    const leaderboard = await getLeaderboard({
      limit,
      programmeId: programmeId ? parseInt(programmeId) : undefined,
      level: level ? parseInt(level) : undefined,
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
