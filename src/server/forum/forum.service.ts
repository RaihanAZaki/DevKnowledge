import type { SessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import type { ForumThreadInput } from "./forum.schema";

function canManage(ownerId: string, user: Pick<SessionUser, "id" | "role">) {
  return ownerId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
}

export async function listForumThreads(params: { search?: string; category?: string }) {
  const { search = "", category = "" } = params;
  return prisma.forumThread.findMany({
    where: {
      ...(CATEGORY_OPTIONS.includes(category as never)
        ? { category: category as (typeof CATEGORY_OPTIONS)[number] }
        : {}),
      ...(search
        ? { OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { content: { contains: search, mode: "insensitive" as const } },
          ] }
        : {}),
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      _count: { select: { comments: true } },
      comments: { where: { isAccepted: true }, select: { id: true }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createForumThread(userId: string, data: ForumThreadInput) {
  const thread = await prisma.forumThread.create({
    data: { ...data, authorId: userId },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  await createAuditLog({ userId, action: "CREATE", entity: "FORUM", entityId: thread.id, description: `Created discussion "${thread.title}".` });
  return thread;
}

export async function getForumThread(id: string, user: SessionUser) {
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, role: true } },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: [{ isAccepted: "desc" }, { createdAt: "asc" }],
      },
    },
  });
  if (!thread) throw new AppError("Discussion not found.", 404);
  return { thread, canManage: canManage(thread.authorId, user), currentUserId: user.id };
}

export async function deleteForumThread(id: string, user: SessionUser) {
  const current = await prisma.forumThread.findUnique({ where: { id }, select: { authorId: true, title: true } });
  if (!current) throw new AppError("Discussion not found.", 404);
  if (!canManage(current.authorId, user)) throw new AppError("Forbidden.", 403);
  await prisma.forumThread.delete({ where: { id } });
  await createAuditLog({ userId: user.id, action: "DELETE", entity: "FORUM", entityId: id, description: `Deleted discussion "${current.title}".` });
}

export async function createForumComment(threadId: string, userId: string, content: string) {
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { id: true } });
  if (!thread) throw new AppError("Discussion not found.", 404);
  return prisma.forumComment.create({
    data: { threadId, authorId: userId, content },
    include: { author: { select: { id: true, name: true, role: true } } },
  });
}

export async function acceptForumComment(threadId: string, commentId: string, user: SessionUser) {
  const thread = await prisma.forumThread.findUnique({ where: { id: threadId }, select: { authorId: true } });
  if (!thread) throw new AppError("Discussion not found.", 404);
  if (!canManage(thread.authorId, user)) throw new AppError("Forbidden.", 403);
  const comment = await prisma.forumComment.findUnique({ where: { id: commentId }, select: { threadId: true } });
  if (!comment || comment.threadId !== threadId) throw new AppError("Comment not found.", 404);
  await prisma.$transaction([
    prisma.forumComment.updateMany({ where: { threadId }, data: { isAccepted: false } }),
    prisma.forumComment.update({ where: { id: commentId }, data: { isAccepted: true } }),
  ]);
}

export async function deleteForumComment(threadId: string, commentId: string, user: SessionUser) {
  const comment = await prisma.forumComment.findUnique({
    where: { id: commentId },
    include: { thread: { select: { authorId: true } } },
  });
  if (!comment) throw new AppError("Comment not found.", 404);
  if (comment.threadId !== threadId) throw new AppError("Comment does not belong to this discussion.", 400);

  const allowed = comment.authorId === user.id || comment.thread.authorId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
  if (!allowed) throw new AppError("Forbidden.", 403);
  await prisma.forumComment.delete({ where: { id: commentId } });
}
