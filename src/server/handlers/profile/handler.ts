import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { getOwnProfile } from "@/server/profile/profile.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const profile = await getOwnProfile(user.id);
    return NextResponse.json({ profile });
  } catch (error) { return safeError(error); }
}
