import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import {
  createNotification,
  deleteNotificationsByReference,
} from "@/server/notifications/notification.service";

export async function getFriendOverview(userId: string) {
  const [friendships, incoming, outgoing] = await Promise.all([
    prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
      include: {
        requester: { select: { id: true, name: true, bio: true, avatarUrl: true, role: true } },
        addressee: { select: { id: true, name: true, bio: true, avatarUrl: true, role: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      include: { requester: { select: { id: true, name: true, bio: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: { addressee: { select: { id: true, name: true, bio: true, avatarUrl: true, role: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  const friends = friendships.map((friendship) => ({
    friendshipId: friendship.id,
    user: friendship.requesterId === userId ? friendship.addressee : friendship.requester,
  }));
  return { friends, incoming, outgoing };
}

export async function sendFriendRequest(userId: string, targetUserId: string) {
  if (targetUserId === userId) throw new AppError("You cannot add yourself.", 400);

  const [requester, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    }),
  ]);

  if (!requester) throw new AppError("User not found.", 404);
  if (!targetUser) throw new AppError("User not found.", 404);

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: userId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") throw new AppError("You are already friends.", 409);
    throw new AppError("Friend request already exists.", 409);
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: userId, addresseeId: targetUserId },
  });

  await createNotification({
    userId: targetUserId,
    title: "New friend request",
    message: `${requester.name} wants to connect with you.`,
    type: "FRIEND_REQUEST",
    referenceId: friendship.id,
  });

  return friendship;
}

export async function acceptFriendRequest(id: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id },
    include: {
      addressee: { select: { name: true } },
    },
  });

  if (!friendship) throw new AppError("Friend request not found.", 404);
  if (friendship.addresseeId !== userId) throw new AppError("Forbidden.", 403);
  if (friendship.status === "ACCEPTED") throw new AppError("Friend request already accepted.", 409);

  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: "ACCEPTED" },
  });

  await Promise.all([
    deleteNotificationsByReference({
      userId,
      type: "FRIEND_REQUEST",
      referenceId: id,
    }),
    createNotification({
      userId: friendship.requesterId,
      title: "Friend request accepted",
      message: `${friendship.addressee.name} accepted your friend request.`,
      type: "FRIEND_ACCEPTED",
      referenceId: friendship.addresseeId,
    }),
  ]);

  return updated;
}

export async function rejectFriendRequest(id: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friend request not found.", 404);
  if (friendship.addresseeId !== userId) throw new AppError("Forbidden.", 403);

  await prisma.friendship.delete({ where: { id } });

  await deleteNotificationsByReference({
    userId,
    type: "FRIEND_REQUEST",
    referenceId: id,
  });
}

export async function removeFriendship(id: string, userId: string) {
  const friendship = await prisma.friendship.findUnique({ where: { id } });
  if (!friendship) throw new AppError("Friendship not found.", 404);
  if (friendship.requesterId !== userId && friendship.addresseeId !== userId) throw new AppError("Forbidden.", 403);
  await prisma.friendship.delete({ where: { id } });
}
