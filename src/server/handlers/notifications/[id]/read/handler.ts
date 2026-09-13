import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { markNotificationRead } from "@/server/notifications/notification.service";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);

    const { id } = await context.params;
    const notification = await markNotificationRead(id, user.id);
    return NextResponse.json({ notification });
  } catch (error) {
    return safeError(error);
  }
}
