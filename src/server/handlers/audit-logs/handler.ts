import { NextRequest, NextResponse } from "next/server";

import { getServerSession } from "@/lib/auth";
import { listAuditLogs } from "@/server/audit/audit.service";

export async function GET(
  request: NextRequest,
) {
  const user =
    await getServerSession();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      {
        status: 401,
      },
    );
  }

  const {
    searchParams,
  } = request.nextUrl;

  const search =
    searchParams.get("search") ??
    "";

  const action =
    searchParams.get("action") ??
    "";

  const entity =
    searchParams.get("entity") ??
    "";

  const page =
    Number(
      searchParams.get(
        "page",
      ) ?? "1",
    );

  const limit =
    Number(
      searchParams.get(
        "limit",
      ) ?? "20",
    );

  const result =
    await listAuditLogs(
      user,
      {
        search,
        action,
        entity,
        page,
        limit,
      },
    );

  return NextResponse.json(
    result,
  );
}