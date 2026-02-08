import { prisma } from "@/lib/db";

// Point costs for AI features
export const POINT_COSTS = {
  AI_CHAT_MESSAGE: 5,
  AI_QUIZ_GENERATION: 20,
  AI_DOCUMENT_UPLOAD: 10,
} as const;

/**
 * Check if user has sufficient points
 */
export async function checkBalance(
  userId: string,
  requiredPoints: number,
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  if (!user) return false;
  return user.points >= requiredPoints;
}

/**
 * Deduct points from user and create history entry
 */
export async function deductPoints(
  userId: string,
  amount: number,
  action: "AI_CHAT_MESSAGE" | "AI_QUIZ_GENERATION" | "AI_DOCUMENT_UPLOAD",
  description: string,
): Promise<{ success: boolean; newBalance: number }> {
  try {
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get current user points
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { points: true },
      });

      if (!user) {
        throw new Error("User not found");
      }

      if (user.points < amount) {
        throw new Error("Insufficient points");
      }

      // Deduct points
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { decrement: amount } },
        select: { points: true },
      });

      // Create point history
      await tx.pointHistory.create({
        data: {
          userId,
          points: -amount, // Negative for deduction
          action,
          description,
        },
      });

      return { success: true, newBalance: updatedUser.points };
    });

    return result;
  } catch (error) {
    console.error("Error deducting points:", error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Get user's current point balance
 */
export async function getUserPoints(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true },
  });

  return user?.points ?? 0;
}

/**
 * Add points to user (for earning points)
 */
export async function addPoints(
  userId: string,
  amount: number,
  action:
    | "MATERIAL_UPLOAD"
    | "MATERIAL_APPROVED"
    | "POST_CREATED"
    | "COMMENT_CREATED"
    | "DAILY_LOGIN"
    | "STREAK_BONUS"
    | "ADMIN_AWARD",
  description: string,
): Promise<{ success: boolean; newBalance: number }> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { points: { increment: amount } },
        select: { points: true },
      });

      await tx.pointHistory.create({
        data: {
          userId,
          points: amount, // Positive for addition
          action,
          description,
        },
      });

      return { success: true, newBalance: updatedUser.points };
    });

    return result;
  } catch (error) {
    console.error("Error adding points:", error);
    return { success: false, newBalance: 0 };
  }
}
