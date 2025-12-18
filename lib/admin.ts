import { prisma } from "./db";

export async function isAdmin(
  userOrId: string | { role: string }
): Promise<boolean> {
  if (typeof userOrId === "string") {
    const user = await prisma.user.findUnique({
      where: { id: userOrId },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  }
  return userOrId.role === "ADMIN";
}

import { env } from "./env";

export const ADMIN_EMAILS = env.ADMIN_EMAILS.split(",").map((email) =>
  email.trim()
);

export async function ensureAdmin(userOrId: string | { role: string }) {
  const admin = await isAdmin(userOrId);
  if (!admin) {
    throw new Error("Unauthorized: Admin access required");
  }
}
