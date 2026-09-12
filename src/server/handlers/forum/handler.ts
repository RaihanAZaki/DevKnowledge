import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { createForumThread, listForumThreads } from "@/server/forum/forum.service";
import { forumThreadSchema } from "@/server/forum/forum.schema";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const threads = await listForumThreads({
      search: request.nextUrl.searchParams.get("search")?.trim() ?? "",
      category: request.nextUrl.searchParams.get("category")?.trim() ?? "",
    });
    return NextResponse.json({ threads });
  } catch (error) { return safeError(error); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = forumThreadSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid discussion data.", 422, parsed.error.flatten());
    const thread = await createForumThread(user.id, parsed.data);
    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) { return safeError(error); }
}
