import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { createForumComment } from "@/server/forum/forum.service";
import { forumCommentSchema } from "@/server/forum/forum.schema";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const parsed = forumCommentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Comment cannot be empty.", 422);
    const comment = await createForumComment(id, user.id, parsed.data.content);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) { return safeError(error); }
}
