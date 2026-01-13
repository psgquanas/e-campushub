import { prisma } from "@/lib/db";
import { PointAction } from "@/lib/generated/prisma/client";

// Point values for different actions
export const POINT_VALUES = {
  MATERIAL_UPLOAD: 10,
  MATERIAL_APPROVED: 50,
  MATERIAL_DOWNLOADED: 2,
  POST_CREATED: 5,
  POST_LIKED: 1,
  COMMENT_CREATED: 3,
  COMMENT_LIKED: 1,
  PROFILE_COMPLETED: 20,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 5,
  ADMIN_AWARD: 0,
  PENALTY: 0,
} as const;

export async function awardPoints({
  userId,
  action,
  points,
  description,
}: {
  userId: string;
  action: PointAction;
  points?: number;
  description?: string;
}) {
  const pointsToAward = points ?? POINT_VALUES[action];

  await prisma.pointHistory.create({
    data: {
      userId,
      points: pointsToAward,
      action,
      description: description || getDefaultDescription(action, pointsToAward),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      points: {
        increment: pointsToAward,
      },
    },
  });

  return pointsToAward;
}

function getDefaultDescription(action: PointAction, points: number): string {
  const descriptions: Record<PointAction, string> = {
    MATERIAL_UPLOAD: "Uploaded course material",
    MATERIAL_APPROVED: "Material approved by admin",
    MATERIAL_DOWNLOADED: "Your material was downloaded",
    POST_CREATED: "Created a post",
    POST_LIKED: "Your post received a like",
    COMMENT_CREATED: "Added a comment",
    COMMENT_LIKED: "Your comment received a like",
    PROFILE_COMPLETED: "Completed profile",
    DAILY_LOGIN: "Daily login bonus",
    STREAK_BONUS: "Login streak bonus",
    ADMIN_AWARD: `Awarded ${points} points by admin`,
    PENALTY: `Deducted ${Math.abs(points)} points`,
  };

  return descriptions[action];
}

export async function getUserRank(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user) return 0;

  const rank = await prisma.user.count({
    where: {
      points: {
        gt: user.points,
      },
    },
  });

  return rank + 1;
}

export async function getLeaderboard({
  limit = 15,
  programmeId,
  level,
}: {
  limit?: number;
  programmeId?: number;
  level?: number;
} = {}) {
  return await prisma.user.findMany({
    where: {
      ...(programmeId && { programmeId }),
      ...(level && { currentLevel: level }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      points: true,
      programme: {
        select: {
          name: true,
        },
      },
      currentLevel: true,
    },
    orderBy: {
      points: "desc",
    },
    take: limit,
  });
}

// Simple in-memory set to prevent multiple concurrent calls for the same user in the same instance
const activeLoginAwards = new Set<string>();

export async function checkAndAwardDailyLogin(userId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD format

  // Quick in-memory check to prevent parallel fires in the same process
  if (activeLoginAwards.has(userId)) return false;

  try {
    activeLoginAwards.add(userId);

    // Check if user already has a login record for today
    const existingLoginToday = await prisma.pointHistory.findFirst({
      where: {
        userId,
        action: "DAILY_LOGIN",
        loginDate: todayStr,
      },
      select: { id: true },
    });

    if (existingLoginToday) {
      return false; // Already logged in today
    }

    // Create daily login record
    await prisma.pointHistory.create({
      data: {
        userId,
        action: "DAILY_LOGIN",
        points: POINT_VALUES.DAILY_LOGIN,
        description: "Daily login bonus",
        loginDate: todayStr,
      },
    });

    // Update user points
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: POINT_VALUES.DAILY_LOGIN,
        },
      },
    });

    return true;
  } catch (error: any) {
    // Handle unique constraint violations (duplicate login)
    if (error.code === "P2002") {
      return false;
    }
    console.error("Failed to award daily login:", error);
    return false;
  } finally {
    // Always remove from active set
    activeLoginAwards.delete(userId);
  }
}
