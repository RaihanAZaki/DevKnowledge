import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { globalSearch } from "@/server/search/search.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    return NextResponse.json(await globalSearch(user.id, query));
  } catch (error) { return safeError(error); }
}
