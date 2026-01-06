import { prisma } from "@/lib/db";
import { PointAction } from "@/lib/generated/prisma/client";
import { withRetry } from "@/lib/retry";

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
};

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

  // 1. Quick in-memory check to prevent parallel fires in the same process
  if (activeLoginAwards.has(userId)) return false;

  try {
    // 2. Check if user already has a login record for today (OUTSIDE transaction)
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

    activeLoginAwards.add(userId);

    // 3. Get user data for streak calculation (OUTSIDE transaction)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginDate: true, currentStreak: true },
    });

    if (!user) {
      return false;
    }

    const lastLogin = user.lastLoginDate;

    // Calculate streak
    let newStreak = 1;
    let streakBonus = 0;

    if (lastLogin) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const lastLoginDate = new Date(lastLogin);
      lastLoginDate.setHours(0, 0, 0, 0);

      if (lastLoginDate.getTime() === yesterday.getTime()) {
        newStreak = user.currentStreak + 1;
        streakBonus = POINT_VALUES.STREAK_BONUS;
      }
    }

    const totalPoints = POINT_VALUES.DAILY_LOGIN + streakBonus;

    // 4. Now do the transaction with all data ready (should be FAST)
    return await withRetry(
      async () => {
        return await prisma.$transaction(
          async (tx) => {
            // Create daily login record
            await tx.pointHistory.create({
              data: {
                userId,
                action: "DAILY_LOGIN",
                points: POINT_VALUES.DAILY_LOGIN,
                description: "Daily login bonus",
                loginDate: todayStr,
              },
            });

            // Create streak bonus if applicable
            if (newStreak > 1) {
              await tx.pointHistory.create({
                data: {
                  userId,
                  action: "STREAK_BONUS",
                  points: POINT_VALUES.STREAK_BONUS,
                  description: `Login streak bonus (${newStreak} days)`,
                  loginDate: todayStr,
                },
              });
            }

            // Update user
            await tx.user.update({
              where: { id: userId },
              data: {
                lastLoginDate: new Date(),
                currentStreak: newStreak,
                points: {
                  increment: totalPoints,
                },
              },
            });

            return true;
          },
          {
            timeout: 5000, // Reduced to 5 seconds since all data is pre-fetched
          }
        );
      },
      {
        maxAttempts: 2, // Reduced attempts since we pre-check
        initialDelayMs: 100,
        maxDelayMs: 500,
      }
    );
  } catch (error: any) {
    // Don't retry on unique constraint violations
    if (error.code === "P2002") {
      return false;
    }
    console.error("Failed to award daily login:", error);
    return false; // Fail gracefully instead of throwing
  } finally {
    // Always remove from active set
    activeLoginAwards.delete(userId);
  }
}
