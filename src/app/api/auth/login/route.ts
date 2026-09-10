import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";
import { AUTH_COOKIE } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Email or password is invalid.", 422);

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return jsonError("Email or password is incorrect.", 401);
    }

    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = await signSession(sessionUser);
    const response = NextResponse.json({ user: sessionUser });
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
