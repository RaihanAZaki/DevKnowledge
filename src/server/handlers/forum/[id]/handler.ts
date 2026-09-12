import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { deleteForumThread, getForumThread } from "@/server/forum/forum.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    return NextResponse.json(await getForumThread(id, user));
  } catch (error) { return safeError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    await deleteForumThread(id, user);
    return NextResponse.json({ ok: true });
  } catch (error) { return safeError(error); }
}
