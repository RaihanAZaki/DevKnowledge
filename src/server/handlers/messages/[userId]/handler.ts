import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { getConversation, sendMessage } from "@/server/messages/message.service";
import { messageSchema } from "@/server/messages/message.schema";

type Context = { params: Promise<{ userId: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const me = await requireUser(request);
    if (!me) return jsonError("Unauthorized.", 401);
    const { userId } = await context.params;
    return NextResponse.json(await getConversation(me.id, userId));
  } catch (error) { return safeError(error); }
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const me = await requireUser(request);
    if (!me) return jsonError("Unauthorized.", 401);
    const { userId } = await context.params;
    const parsed = messageSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid message.", 422, parsed.error.flatten());
    const message = await sendMessage(me.id, userId, parsed.data.content);
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) { return safeError(error); }
}
