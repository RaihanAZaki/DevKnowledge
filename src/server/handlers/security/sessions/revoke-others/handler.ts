import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { revokeOtherSessions } from "@/server/security/security.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const result = await revokeOtherSessions(user.id, user.sessionId);
    return NextResponse.json(result);
  } catch (error) {
    return safeError(error);
  }
}
