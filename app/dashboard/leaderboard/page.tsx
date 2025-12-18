import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLeaderboard, getUserRank } from "@/lib/point";
import { prisma } from "@/lib/db";
import LeaderboardClient from "./LeaderboardClient";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { filter } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      programmeId: true,
      programme: {
        select: {
          name: true,
        },
      },
      currentLevel: true,
    },
  });

  // Determine filter parameters
  let queryParams: { programmeId?: number; level?: number; limit?: number } = {
    limit: 50,
  };

  if (filter === "programme" && user?.programmeId) {
    queryParams.programmeId = user.programmeId;
  } else if (filter === "level" && user?.currentLevel) {
    queryParams.level = user.currentLevel;
  }

  const leaderboard = await getLeaderboard(queryParams);
  const userRank = await getUserRank(session.user.id);

  return (
    <div className="container py-8">
      <LeaderboardClient
        leaderboard={leaderboard}
        currentUser={{
          ...user!,
          rank: userRank,
        }}
        initialFilter={(filter as "all" | "programme" | "level") || "all"}
      />
    </div>
  );
}
