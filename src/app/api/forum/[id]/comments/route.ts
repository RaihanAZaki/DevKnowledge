import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({ content: z.string().trim().min(2).max(10000) });
type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const thread = await prisma.forumThread.findUnique({ where: { id }, select: { id: true } });
    if (!thread) return jsonError("Discussion not found.", 404);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Comment cannot be empty.", 422);
    const comment = await prisma.forumComment.create({
      data: { threadId: id, authorId: user.id, content: parsed.data.content },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
}
