import { prisma } from "@/lib/prisma";

export async function globalSearch(userId: string, query: string) {
  const cleanQuery = query.trim().slice(0, 120);
  if (cleanQuery.length < 2) return { snippets: [], documents: [], threads: [] };

  const contains = { contains: cleanQuery, mode: "insensitive" as const };

  const [snippets, documents, threads] = await Promise.all([
    prisma.codeSnippet.findMany({
      where: {
        OR: [
          { title: contains },
          { ticketNo: contains },
          { reason: contains },
        ],
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.documentation.findMany({
      where: {
        AND: [
          {
            OR: [
              { authorId: userId },
              { visibility: "PUBLIC", isPublished: true },
              { sharedWith: { some: { userId } } },
            ],
          },
          {
            OR: [
              { title: contains },
              { content: contains },
              { excerpt: contains },
            ],
          },
        ],
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.forumThread.findMany({
      where: {
        OR: [
          { title: contains },
          { content: contains },
        ],
      },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  return { snippets, documents, threads };
}
