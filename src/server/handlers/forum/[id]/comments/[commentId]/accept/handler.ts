import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { acceptForumComment } from "@/server/forum/forum.service";

type Context = { params: Promise<{ id: string; commentId: string }> };

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id, commentId } = await context.params;
    await acceptForumComment(id, commentId, user);
    return NextResponse.json({ ok: true });
  } catch (error) { return safeError(error); }
}
