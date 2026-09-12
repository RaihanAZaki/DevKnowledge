import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { bookmarkSchema } from "@/server/bookmark/bookmark.schema";
import { createBookmark } from "@/server/bookmark/bookmark.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = bookmarkSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid bookmark data.", 422, parsed.error.flatten());
    const bookmark = await createBookmark(user.id, parsed.data);
    return NextResponse.json({ bookmark }, { status: 201 });
  } catch (error) { return safeError(error); }
}
