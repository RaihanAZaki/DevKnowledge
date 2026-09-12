import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [snippets, documents, threads, recentSnippets, recentDocuments, recentThreads] = await Promise.all([
    prisma.codeSnippet.count(),
    prisma.documentation.count({ where: { isPublished: true } }),
    prisma.forumThread.count(),
    prisma.codeSnippet.findMany({ take: 3, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, ticketNo: true, language: true, updatedAt: true } }),
    prisma.documentation.findMany({ take: 3, where: { isPublished: true }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, language: true, updatedAt: true } }),
    prisma.forumThread.findMany({ take: 3, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, category: true, updatedAt: true } }),
  ]);
  const recent = [
    ...recentSnippets.map((item) => ({ ...item, type: "snippet" as const, meta: `${item.ticketNo} · ${item.language}` })),
    ...recentDocuments.map((item) => ({ ...item, type: "document" as const, meta: item.language })),
    ...recentThreads.map((item) => ({ ...item, type: "forum" as const, meta: item.category })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, 6);
  return { stats: { snippets, documents, threads }, recent };
}
