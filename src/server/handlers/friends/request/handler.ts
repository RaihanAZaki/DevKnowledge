import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { friendRequestSchema } from "@/server/friends/friend.schema";
import { sendFriendRequest } from "@/server/friends/friend.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);
    if (!user) return jsonError("Unauthorized.", 401);
    const parsed = friendRequestSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid friend request.", 422, parsed.error.flatten());
    const friendship = await sendFriendRequest(user.id, parsed.data.userId);
    return NextResponse.json({ friendship }, { status: 201 });
  } catch (error) { return safeError(error); }
}
