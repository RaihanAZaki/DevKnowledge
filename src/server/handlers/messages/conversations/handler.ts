import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { listConversations } from "@/server/messages/message.service";

export async function GET(request: NextRequest) {
  try {
    const me = await requireUser(request);
    if (!me) return jsonError("Unauthorized.", 401);
    const conversations = await listConversations(me.id);
    return NextResponse.json({ conversations });
  } catch (error) { return safeError(error); }
}
