import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { searchUsers } from "@/server/users/user.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const users = await searchUsers(user.id, query);
    return NextResponse.json({ users });
  } catch (error) { return safeError(error); }
}
