import { prisma } from "@/lib/db";
import { PointAction } from "@/lib/generated/prisma/client";
import { withRetry } from "@/lib/retry";

// Point values for different actions
export const POINT_VALUES = {
  MATERIAL_UPLOAD: 10,
  MATERIAL_APPROVED: 50, // Bonus when material gets approved
  MATERIAL_DOWNLOADED: 2, // Per download
  POST_CREATED: 5,
  POST_LIKED: 1,
  COMMENT_CREATED: 3,
  COMMENT_LIKED: 1,
  PROFILE_COMPLETED: 20,
  DAILY_LOGIN: 5,
  STREAK_BONUS: 5, // Per day in streak
  ADMIN_AWARD: 0, // Variable, set by admin
  PENALTY: 0, // Variable, set by admin
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

  // Create point history record
  await prisma.pointHistory.create({
    data: {
      userId,
      points: pointsToAward,
      action,
      description: description || getDefaultDescription(action, pointsToAward),
    },
  });

  // Update user's total points
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

  // 1. Quick in-memory check to prevent parallel fires in the same process
  if (activeLoginAwards.has(userId)) return false;

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

  try {
    // Use retry logic with exponential backoff for the entire operation
    return await withRetry(
      async () => {
        // Wrap only the writing queries in a transaction
        return await prisma.$transaction(
          async (tx) => {
            // Re-verify inside transaction to prevent race conditions
            const user = await tx.user.findUnique({
              where: { id: userId },
              select: { lastLoginDate: true, currentStreak: true },
            });

            if (!user) return false;

            const lastLogin = user.lastLoginDate;

            // Final check inside the lock
            if (lastLogin && lastLogin >= today) {
              return false;
            }

            // Calculate streak
            let newStreak = 1;
            if (lastLogin) {
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);

              const lastLoginDate = new Date(lastLogin);
              lastLoginDate.setHours(0, 0, 0, 0);

              if (lastLoginDate.getTime() === yesterday.getTime()) {
                newStreak = user.currentStreak + 1;
              }
            }

            const totalPoints =
              POINT_VALUES.DAILY_LOGIN +
              (newStreak > 1 ? POINT_VALUES.STREAK_BONUS : 0);

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

            // Create point history records
            const pointHistoryRecords = [
              {
                userId,
                action: "DAILY_LOGIN" as PointAction,
                points: POINT_VALUES.DAILY_LOGIN,
                description: "Daily login bonus",
              },
            ];

            if (newStreak > 1) {
              pointHistoryRecords.push({
                userId,
                action: "STREAK_BONUS" as PointAction,
                points: POINT_VALUES.STREAK_BONUS,
                description: `Login streak bonus (${newStreak} days)`,
              });
            }

            await tx.pointHistory.createMany({
              data: pointHistoryRecords,
            });

            return true;
          },
          {
            timeout: 20000, // 20 second timeout for transaction
          }
        );
      },
      {
        maxAttempts: 3,
        initialDelayMs: 200,
        maxDelayMs: 2000,
      }
    );
  } finally {
    // Always remove from active set so they can earn points again tomorrow
    activeLoginAwards.delete(userId);
  }
}
