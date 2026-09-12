import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { deleteSnippet, getSnippetById, updateSnippet } from "@/server/snippets/snippet.service";
import { snippetSchema } from "@/server/snippets/snippet.schema";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    return NextResponse.json(await getSnippetById(id, user));
  } catch (error) { return safeError(error); }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const parsed = snippetSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid snippet data.", 422, parsed.error.flatten());
    const snippet = await updateSnippet(id, user, parsed.data);
    return NextResponse.json({ snippet });
  } catch (error) { return safeError(error); }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    await deleteSnippet(id, user);
    return NextResponse.json({ ok: true });
  } catch (error) { return safeError(error); }
}
