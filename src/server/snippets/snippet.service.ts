import type { SessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import type { SnippetInput } from "./snippet.schema";

function canManage(ownerId: string, user: Pick<SessionUser, "id" | "role">) {
  return ownerId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
}

export async function listSnippets(params: { search?: string; language?: string; category?: string }) {
  const { search = "", language = "", category = "" } = params;
  return prisma.codeSnippet.findMany({
    where: {
      ...(language ? { language } : {}),
      ...(CATEGORY_OPTIONS.includes(category as never)
        ? { category: category as (typeof CATEGORY_OPTIONS)[number] }
        : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { ticketNo: { contains: search, mode: "insensitive" as const } },
              { reason: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { author: { select: { id: true, name: true, role: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createSnippet(userId: string, data: SnippetInput) {
  const snippet = await prisma.codeSnippet.create({
    data: {
      ...data,
      description: data.description || null,
      impact: data.impact || null,
      framework: data.framework || null,
      authorId: userId,
    },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  await createAuditLog({ userId, action: "CREATE", entity: "SNIPPET", entityId: snippet.id, description: `Created code snippet "${snippet.title}".` });
  return snippet;
}

export async function getSnippetById(id: string, user: SessionUser) {
  const snippet = await prisma.codeSnippet.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  if (!snippet) throw new AppError("Snippet not found.", 404);
  return { snippet, canManage: canManage(snippet.authorId, user) };
}

export async function updateSnippet(id: string, user: SessionUser, data: SnippetInput) {
  const current = await prisma.codeSnippet.findUnique({ where: { id }, select: { authorId: true } });
  if (!current) throw new AppError("Snippet not found.", 404);
  if (!canManage(current.authorId, user)) throw new AppError("Forbidden.", 403);

  const snippet = await prisma.codeSnippet.update({
    where: { id },
    data: { ...data, description: data.description || null, impact: data.impact || null, framework: data.framework || null },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  await createAuditLog({ userId: user.id, action: "UPDATE", entity: "SNIPPET", entityId: snippet.id, description: `Updated code snippet "${snippet.title}".` });
  return snippet;
}

export async function deleteSnippet(id: string, user: SessionUser) {
  const current = await prisma.codeSnippet.findUnique({ where: { id }, select: { authorId: true, title: true } });
  if (!current) throw new AppError("Snippet not found.", 404);
  if (!canManage(current.authorId, user)) throw new AppError("Forbidden.", 403);
  await prisma.codeSnippet.delete({ where: { id } });
  await createAuditLog({ userId: user.id, action: "DELETE", entity: "SNIPPET", entityId: id, description: `Deleted code snippet "${current.title}".` });
}
