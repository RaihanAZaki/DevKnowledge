import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export type NotificationType =
  | "FRIEND_REQUEST"
  | "FRIEND_ACCEPTED"
  | "FORUM_REPLY"
  | "FORUM_ACCEPTED"
  | "BADGE"
  | "MESSAGE"
  | "GROUP_MESSAGE"
  | "GROUP_MEMBER"
  | "GROUP_ADMIN"
  | "GROUP_MENTION"
  | string;

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  referenceId?: string | null;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type,
      referenceId: params.referenceId ?? null,
    },
  });
}


async function ensurePendingFriendRequestNotifications(userId: string) {
  const pending = await prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: "PENDING",
    },
    include: {
      requester: {
        select: {
          name: true,
        },
      },
    },
  });

  if (pending.length === 0) return;

  const existing = await prisma.notification.findMany({
    where: {
      userId,
      type: "FRIEND_REQUEST",
      referenceId: {
        in: pending.map((friendship) => friendship.id),
      },
    },
    select: {
      referenceId: true,
    },
  });

  const existingIds = new Set(
    existing
      .map((item) => item.referenceId)
      .filter((value): value is string => Boolean(value)),
  );

  const missing = pending.filter((friendship) => !existingIds.has(friendship.id));

  if (missing.length === 0) return;

  await prisma.notification.createMany({
    data: missing.map((friendship) => ({
      userId,
      title: "New friend request",
      message: `${friendship.requester.name} wants to connect with you.`,
      type: "FRIEND_REQUEST",
      referenceId: friendship.id,
    })),
  });
}

export async function listNotifications(userId: string, limit = 30) {
  await ensurePendingFriendRequestNotifications(userId);

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function deleteNotificationsByReference(params: {
  userId: string;
  type?: NotificationType;
  referenceId: string;
}) {
  await prisma.notification.deleteMany({
    where: {
      userId: params.userId,
      referenceId: params.referenceId,
      ...(params.type ? { type: params.type } : {}),
    },
  });
}
