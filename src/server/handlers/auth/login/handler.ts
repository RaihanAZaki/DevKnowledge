import { NextResponse } from "next/server";
import { signSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { authenticateUser } from "@/server/auth/auth.service";
import { loginSchema } from "@/server/auth/auth.schema";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Email or password is invalid.", 422);
    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    const token = await signSession(user);
    const response = NextResponse.json({ user });
    response.cookies.set(AUTH_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    return response;
  } catch (error) { return safeError(error); }
}
