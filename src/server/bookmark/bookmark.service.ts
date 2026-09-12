import { prisma } from "@/lib/prisma";
export async function createBookmark(userId: string, input: { targetId: string; type: "SNIPPET" | "DOCUMENTATION" | "FORUM" }) {
  return prisma.bookmark.create({ data: { userId, targetId: input.targetId, type: input.type } });
}
