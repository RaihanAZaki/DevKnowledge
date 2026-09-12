import { prisma } from "@/lib/prisma";

export async function updateUserProfile(userId: string, input: { name: string; bio?: string | null }) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: input.name, bio: input.bio || null },
    select: { id: true, name: true, email: true, role: true, bio: true, avatarUrl: true },
  });
}

export async function searchUsers(userId: string, query: string) {
  if (query.length < 2) return [];
  return prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { name: { contains: query, mode: "insensitive" as const } },
        { email: { contains: query, mode: "insensitive" as const } },
      ],
    },
    select: { id: true, name: true, role: true, bio: true, avatarUrl: true },
    orderBy: { name: "asc" },
    take: 10,
  });
}
