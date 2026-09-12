import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { listAuditLogs } from "@/server/audit/audit.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const result = await listAuditLogs({
      search: request.nextUrl.searchParams.get("search")?.trim() ?? "",
      action: request.nextUrl.searchParams.get("action")?.trim() ?? "",
      entity: request.nextUrl.searchParams.get("entity")?.trim() ?? "",
      page: Number(request.nextUrl.searchParams.get("page")),
      limit: Number(request.nextUrl.searchParams.get("limit")),
    });
    return NextResponse.json(result);
  } catch (error) { return safeError(error); }
}
