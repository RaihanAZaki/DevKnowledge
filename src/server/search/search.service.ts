import { prisma } from "@/lib/prisma";

export async function globalSearch(userId: string, query: string) {
  if (query.length < 2) return { snippets: [], documents: [], threads: [] };
  const [snippets, documents, threads] = await Promise.all([
    prisma.codeSnippet.findMany({
      where: { OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { ticketNo: { contains: query, mode: "insensitive" as const } },
        { reason: { contains: query, mode: "insensitive" as const } },
      ] },
      select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 5,
    }),
    prisma.documentation.findMany({
      where: { AND: [
        { OR: [{ isPublished: true }, { authorId: userId }] },
        { OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { content: { contains: query, mode: "insensitive" as const } },
        ] },
      ] },
      select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 5,
    }),
    prisma.forumThread.findMany({
      where: { OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        { content: { contains: query, mode: "insensitive" as const } },
      ] },
      select: { id: true, title: true }, orderBy: { updatedAt: "desc" }, take: 5,
    }),
  ]);
  return { snippets, documents, threads };
}
