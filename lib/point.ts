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
    // 2. Perform a read-only check OUTSIDE the transaction.
    // This avoids starting a transaction for 99% of requests.
    const userCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastLoginDate: true },
    });

    if (userCheck?.lastLoginDate && userCheck.lastLoginDate >= today) {
      return false;
    }

    activeLoginAwards.add(userId);

    return await withRetry(
      async () => {
        return await prisma.$transaction(
          async (tx) => {
            // Try to create DAILY_LOGIN record - unique constraint prevents duplicates
            try {
              await tx.pointHistory.create({
                data: {
                  userId,
                  action: "DAILY_LOGIN",
                  points: POINT_VALUES.DAILY_LOGIN,
                  description: "Daily login bonus",
                  loginDate: todayStr, // Unique constraint on (userId, loginDate)
                },
              });
            } catch (error: any) {
              // P2002 = unique constraint violation (already logged in today)
              if (error.code === "P2002") {
                return false;
              }
              throw error;
            }

            // If we got here, this is the first login today
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { lastLoginDate: true, currentStreak: true },
            });

            if (!user) {
              // Rollback by throwing error
              throw new Error("User not found");
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

            // Add streak bonus if applicable
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

            return true;
          },
          {
            timeout: 20000,
          }
        );
      },
      {
        maxAttempts: 3,
        initialDelayMs: 200,
        maxDelayMs: 2000,
      }
    );
  } catch (error: any) {
    // Don't retry on unique constraint violations
    if (error.code === "P2002") {
      return false;
    }
    console.error("Failed to award daily login:", error);
    throw error;
  } finally {
    // Always remove from active set
    activeLoginAwards.delete(userId);
  }
}
