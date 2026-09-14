import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { revokeSession } from "@/server/security/security.service";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const { id } = await context.params;
    const result = await revokeSession(user.id, user.sessionId, id);
    return NextResponse.json(result);
  } catch (error) {
    return safeError(error);
  }
}
