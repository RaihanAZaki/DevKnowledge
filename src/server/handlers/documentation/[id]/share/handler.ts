import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { shareDocument, unshareDocument } from "@/server/documentation/document.service";
import { documentShareSchema } from "@/server/documentation/document.schema";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const parsed = documentShareSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid share request.", 422, parsed.error.flatten());
    const share = await shareDocument(id, user.id, parsed.data.userId);
    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const parsed = documentShareSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid unshare request.", 422);
    await unshareDocument(id, user.id, parsed.data.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
