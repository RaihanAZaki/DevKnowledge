import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError("Email or password is incorrect.", 401);
  }
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export async function registerUser(input: { name: string; email: string; password: string }) {
  const email = input.email.toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) throw new AppError("Email is already registered.", 409);
  const passwordHash = await bcrypt.hash(input.password, 12);
  return prisma.user.create({
    data: { name: input.name, email, passwordHash },
    select: { id: true, name: true, email: true, role: true },
  });
}

export function getRequestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip")?.trim() || null;
}

export async function createAuthSession(userId: string, request: Request) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return prisma.authSession.create({
    data: {
      userId,
      userAgent: request.headers.get("user-agent")?.slice(0, 1000) || null,
      ipAddress: getRequestIp(request),
      expiresAt,
    },
    select: { id: true, expiresAt: true },
  });
}
