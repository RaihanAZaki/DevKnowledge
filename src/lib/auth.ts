import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { AUTH_COOKIE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
};

const encoder = new TextEncoder();

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }
  return encoder.encode(value);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySessionToken(token?: string | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.email || !payload.name || !payload.role) return null;
    return {
      id: payload.sub,
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

async function refreshSessionUser(session: SessionUser | null): Promise<SessionUser | null> {
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!user) return null;

  // Never trust authorization-sensitive fields such as role from a long-lived JWT.
  // The database is the source of truth, so role changes/revocation take effect immediately.
  return user;
}

export async function getSessionFromRequest(request: NextRequest) {
  const session = await verifySessionToken(request.cookies.get(AUTH_COOKIE)?.value);
  return refreshSessionUser(session);
}

export async function getServerSession() {
  const store = await cookies();
  const session = await verifySessionToken(store.get(AUTH_COOKIE)?.value);
  return refreshSessionUser(session);
}

export async function requireUser(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, bio: true, avatarUrl: true },
  });
}

export async function requireServerUser() {
  const session = await getServerSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, bio: true, avatarUrl: true },
  });
}

export function canManage(ownerId: string, user: { id: string; role: string }) {
  return ownerId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
}
