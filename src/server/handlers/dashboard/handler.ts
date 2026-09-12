import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { getDashboardData } from "@/server/dashboard/dashboard.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const data = await getDashboardData();
    return NextResponse.json({ user, ...data });
  } catch (error) { return safeError(error); }
}
