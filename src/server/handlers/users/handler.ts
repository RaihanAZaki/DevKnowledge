import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireUser, signSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { updateProfileSchema } from "@/server/users/user.schema";
import { updateUserProfile } from "@/server/users/user.service";

export async function PUT(request: NextRequest) {
  try {
    const current = await requireUser(request);
    if (!current) return jsonError("Unauthorized.", 401);
    const parsed = updateProfileSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid profile data.", 422, parsed.error.flatten());
    const user = await updateUserProfile(current.id, parsed.data);
    const token = await signSession({ id: user.id, name: user.name, email: user.email, role: user.role }, current.sessionId);
    const response = NextResponse.json({ user });
    response.cookies.set(AUTH_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return response;
  } catch (error) { return safeError(error); }
}
