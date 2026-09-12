import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { listDocumentShares } from "@/server/documentation/document.service";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    const shares = await listDocumentShares(id, user.id);
    return NextResponse.json({ shares });
  } catch (error) {
    return safeError(error);
  }
}
