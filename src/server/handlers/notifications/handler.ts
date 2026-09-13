import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { listNotifications } from "@/server/notifications/notification.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? "30");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 30;

    const result = await listNotifications(user.id, limit);
    return NextResponse.json(result);
  } catch (error) {
    return safeError(error);
  }
}
