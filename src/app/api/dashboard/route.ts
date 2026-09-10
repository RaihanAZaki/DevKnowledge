import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

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
    ]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 6);

    return NextResponse.json({ user, stats: { snippets, documents, threads }, recent });
  } catch (error) {
    return safeError(error);
  }
}
