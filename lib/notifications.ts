import { prisma } from "@/lib/db";

export async function createNotification({
  userId,
  type,
  title,
  message,
  materialId,
  postId,
  commentId,
}: {
  userId: string;
  type:
    | "MATERIAL_APPROVED"
    | "MATERIAL_REJECTED"
    | "SYSTEM"
    | "POST_LIKED"
    | "COMMENT_LIKED"
    | "COMMENT_REPLY";
  title: string;
  message: string;
  materialId?: string;
  postId?: string;
  commentId?: string;
}) {
  return await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      materialId,
      postId,
      commentId,
    },
  });
}

export async function getUnreadNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    include: {
      material: {
        select: {
          title: true,
          type: true,
        },
      },
      post: {
        select: {
          id: true,
          content: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          postId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    include: {
      material: {
        select: {
          title: true,
          type: true,
        },
      },
      post: {
        select: {
          id: true,
          content: true,
          author: {
            select: {
              name: true,
            },
          },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          postId: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markAsRead(notificationId: string) {
  return await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: { isRead: true },
  });
}
