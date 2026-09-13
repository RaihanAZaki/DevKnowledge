import { prisma } from "@/lib/prisma";

export const ONLINE_WINDOW_MS = 60_000;

export async function touchPresence(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastSeenAt: new Date() },
    select: { id: true, lastSeenAt: true },
  });
}

export function isRecentlyOnline(lastSeenAt: Date | string | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() <= ONLINE_WINDOW_MS;
}
