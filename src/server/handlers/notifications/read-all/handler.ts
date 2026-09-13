import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { markAllNotificationsRead } from "@/server/notifications/notification.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    await markAllNotificationsRead(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return safeError(error);
  }
}
