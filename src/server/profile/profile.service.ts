import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

const commonProfileSelect = {
  id: true, name: true, role: true, bio: true, avatarUrl: true, createdAt: true,
  _count: { select: { snippets: true, documents: true, threads: true } },
  snippets: { select: { id: true, title: true, language: true, updatedAt: true }, orderBy: { updatedAt: "desc" as const }, take: 5 },
  threads: { select: { id: true, title: true, updatedAt: true }, orderBy: { updatedAt: "desc" as const }, take: 5 },
};

export async function getOwnProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...commonProfileSelect,
      email: true,
      documents: { select: { id: true, title: true, language: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 5 },
    },
  });
  if (!profile) throw new AppError("User not found.", 404);
  return profile;
}

export async function getPublicProfile(id: string, currentUserId: string) {
  const profile = await prisma.user.findUnique({
    where: { id },
    select: {
      ...commonProfileSelect,
      documents: {
        where: { isPublished: true },
        select: { id: true, title: true, language: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      },
    },
  });
  if (!profile) throw new AppError("User not found.", 404);
  const friendship = currentUserId === id ? null : await prisma.friendship.findFirst({
    where: { OR: [
      { requesterId: currentUserId, addresseeId: id },
      { requesterId: id, addresseeId: currentUserId },
    ] },
  });
  let status: "SELF" | "NONE" | "PENDING_SENT" | "PENDING_RECEIVED" | "FRIENDS" = "NONE";
  if (currentUserId === id) status = "SELF";
  else if (friendship?.status === "ACCEPTED") status = "FRIENDS";
  else if (friendship?.status === "PENDING") status = friendship.requesterId === currentUserId ? "PENDING_SENT" : "PENDING_RECEIVED";
  return { profile, friendship: friendship ? { id: friendship.id, status } : { id: null, status } };
}
