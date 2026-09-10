import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string; commentId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id, commentId } = await context.params;
    const thread = await prisma.forumThread.findUnique({ where: { id }, select: { authorId: true } });
    if (!thread) return jsonError("Discussion not found.", 404);
    if (thread.authorId !== user.id && user.role !== "ADMIN" && user.role !== "MODERATOR") return jsonError("Forbidden.", 403);
    const comment = await prisma.forumComment.findUnique({ where: { id: commentId }, select: { threadId: true } });
    if (!comment || comment.threadId !== id) return jsonError("Comment not found.", 404);

    await prisma.$transaction([
      prisma.forumComment.updateMany({ where: { threadId: id }, data: { isAccepted: false } }),
      prisma.forumComment.update({ where: { id: commentId }, data: { isAccepted: true } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
