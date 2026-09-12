import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { getPublicProfile } from "@/server/profile/profile.service";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, context: Context) {
  try {
    const currentUser = await requireUser(request);
    if (!currentUser) return jsonError("Unauthorized.", 401);
    const { id } = await context.params;
    return NextResponse.json(await getPublicProfile(id, currentUser.id));
  } catch (error) { return safeError(error); }
}
