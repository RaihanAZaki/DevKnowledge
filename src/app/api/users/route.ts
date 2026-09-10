import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(300).optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const current = await requireUser(request);
    if (!current) return jsonError("Unauthorized.", 401);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return jsonError("Invalid profile data.", 422, parsed.error.flatten());

    const user = await prisma.user.update({
      where: { id: current.id },
      data: { name: parsed.data.name, bio: parsed.data.bio || null },
      select: { id: true, name: true, email: true, role: true, bio: true, avatarUrl: true },
    });
    const token = await signSession({ id: user.id, name: user.name, email: user.email, role: user.role });
    const response = NextResponse.json({ user });
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
