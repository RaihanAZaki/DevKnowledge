import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { removeFriendship } from "@/server/friends/friend.service";

type Context = { params: Promise<{ id: string }> };
export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    await removeFriendship(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) { return safeError(error); }
}
