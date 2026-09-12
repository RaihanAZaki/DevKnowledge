import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { createDocument, listDocuments } from "@/server/documentation/document.service";
import { documentSchema } from "@/server/documentation/document.schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const scope = request.nextUrl.searchParams.get("scope")?.trim() ?? "mine";
    const documents = await listDocuments({
      userId: user.id,
      search: request.nextUrl.searchParams.get("search")?.trim() ?? "",
      language: request.nextUrl.searchParams.get("language")?.trim() ?? "",
      category: request.nextUrl.searchParams.get("category")?.trim() ?? "",
      scope,
    });

    return NextResponse.json({ documents, scope });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const parsed = documentSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid document data.", 422, parsed.error.flatten());

    const document = await createDocument(user.id, parsed.data);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return safeError(error);
  }
}
