import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { getFriendOverview } from "@/server/friends/friend.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    return NextResponse.json(await getFriendOverview(user.id));
  } catch (error) { return safeError(error); }
}
