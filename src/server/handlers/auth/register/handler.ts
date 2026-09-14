import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { createAuthSession, registerUser } from "@/server/auth/auth.service";
import { registerSchema } from "@/server/auth/auth.schema";

export async function POST(request: Request) {
  try {
    const parsed = registerSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid registration data.", 422, parsed.error.flatten());

    const user = await registerUser(parsed.data);
    const session = await createAuthSession(user.id, request);
    const token = await signSession(user, session.id);
    const response = NextResponse.json({ user }, { status: 201 });

    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    return safeError(error);
  }
}
