import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import { resolveKnowledgeAttachment, type KnowledgeAttachmentInput } from "@/server/messages/knowledge-chat.service";

async function ensureFriends(meId: string, userId: string, selfMessage: string) {
  if (userId === meId) throw new AppError(selfMessage, 400);

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: meId, addresseeId: userId },
        { requesterId: userId, addresseeId: meId },
      ],
    },
  });

  if (!friendship) throw new AppError("You can only message friends.", 403);
}

export async function getConversation(meId: string, userId: string) {
  await ensureFriends(meId, userId, "You cannot chat with yourself.");

  const friend = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      role: true,
      avatarUrl: true,
      lastSeenAt: true,
    },
  });

  if (!friend) throw new AppError("User not found.", 404);

  const now = new Date();

  await prisma.directMessage.updateMany({
    where: {
      senderId: userId,
      receiverId: meId,
      isRead: false,
    },
    data: {
      isRead: true,
      readAt: now,
    },
  });

  const messages = await prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: meId, receiverId: userId },
        { senderId: userId, receiverId: meId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return { friend, messages, currentUserId: meId };
}

export async function sendMessage(
  meId: string,
  userId: string,
  content: string,
  attachment?: KnowledgeAttachmentInput | null,
) {
  await ensureFriends(meId, userId, "You cannot message yourself.");

  const cleanContent = content.trim();
  if (!cleanContent && !attachment) throw new AppError("Message or knowledge attachment is required.", 400);
  if (cleanContent.length > 5000) throw new AppError("Message is too long.", 400);

  const knowledge = await resolveKnowledgeAttachment(attachment, [meId, userId]);

  return prisma.directMessage.create({
    data: {
      senderId: meId,
      receiverId: userId,
      content: cleanContent,
      knowledgeType: knowledge?.type ?? null,
      knowledgeId: knowledge?.id ?? null,
      knowledgeTitle: knowledge?.title ?? null,
    },
  });
}

export async function listConversations(meId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: meId }, { addresseeId: meId }],
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
          lastSeenAt: true,
        },
      },
      addressee: {
        select: {
          id: true,
          name: true,
          role: true,
          avatarUrl: true,
          lastSeenAt: true,
        },
      },
    },
  });

  const conversations = await Promise.all(
    friendships.map(async (friendship) => {
      const friend =
        friendship.requesterId === meId
          ? friendship.addressee
          : friendship.requester;

      const [lastMessage, unreadCount] = await Promise.all([
        prisma.directMessage.findFirst({
          where: {
            OR: [
              { senderId: meId, receiverId: friend.id },
              { senderId: friend.id, receiverId: meId },
            ],
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.directMessage.count({
          where: {
            senderId: friend.id,
            receiverId: meId,
            isRead: false,
          },
        }),
      ]);

      return { friend, lastMessage, unreadCount };
    }),
  );

  conversations.sort(
    (a, b) =>
      (b.lastMessage?.createdAt?.getTime() ?? 0) -
      (a.lastMessage?.createdAt?.getTime() ?? 0),
  );

  return conversations;
}
