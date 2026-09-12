import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { deleteDocument, getDocumentById, updateDocument } from "@/server/documentation/document.service";
import { documentSchema } from "@/server/documentation/document.schema";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    return NextResponse.json(await getDocumentById(id, user));
  } catch (error) {
    return safeError(error);
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const parsed = documentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid document data.", 422, parsed.error.flatten());
    const document = await updateDocument(id, user, parsed.data);
    return NextResponse.json({ document });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    await deleteDocument(id, user);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
