import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { createSnippet, listSnippets } from "@/server/snippets/snippet.service";
import { snippetSchema } from "@/server/snippets/snippet.schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const snippets = await listSnippets({
      search: request.nextUrl.searchParams.get("search")?.trim() ?? "",
      language: request.nextUrl.searchParams.get("language")?.trim() ?? "",
      category: request.nextUrl.searchParams.get("category")?.trim() ?? "",
    });
    return NextResponse.json({ snippets });
  } catch (error) { return safeError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = snippetSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid snippet data.", 422, parsed.error.flatten());
    const snippet = await createSnippet(user.id, parsed.data);
    return NextResponse.json({ snippet }, { status: 201 });
  } catch (error) { return safeError(error); }
}
