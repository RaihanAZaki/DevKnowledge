import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { listSessions } from "@/server/security/security.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const sessions = await listSessions(user.id, user.sessionId);
    return NextResponse.json({ sessions });
  } catch (error) {
    return safeError(error);
  }
}
