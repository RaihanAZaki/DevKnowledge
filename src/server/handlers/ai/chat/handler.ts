import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { aiMessageSchema } from "@/server/ai/ai.schema";
import { generateAiReply, getChatHistory } from "@/server/ai/ai.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const messages = await getChatHistory(user.id);
    return NextResponse.json({ messages });
  } catch (error) { return safeError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = aiMessageSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Message is invalid.", 422);
    const message = await generateAiReply(user.id, parsed.data.message);
    return NextResponse.json({ message });
  } catch (error) { return safeError(error); }
}
