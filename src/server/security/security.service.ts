import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export async function changePassword(input: {
  userId: string;
  sessionId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { passwordHash: true },
  });

  if (!user) throw new AppError("User not found.", 404);

  const currentMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!currentMatches) throw new AppError("Current password is incorrect.", 400);

  const sameAsCurrent = await bcrypt.compare(input.newPassword, user.passwordHash);
  if (sameAsCurrent) throw new AppError("New password must be different from your current password.", 400);

  const passwordHash = await bcrypt.hash(input.newPassword, 12);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.userId },
      data: { passwordHash },
    }),
    prisma.authSession.updateMany({
      where: {
        userId: input.userId,
        id: { not: input.sessionId },
        revokedAt: null,
      },
      data: { revokedAt: now },
    }),
  ]);

  return { ok: true };
}

function browserName(userAgent: string | null) {
  if (!userAgent) return "Unknown browser";
  if (/Brave/i.test(userAgent)) return "Brave";
  if (/Edg\//i.test(userAgent)) return "Microsoft Edge";
  if (/OPR\//i.test(userAgent)) return "Opera";
  if (/Chrome\//i.test(userAgent)) return "Chrome";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  return "Browser";
}

function osName(userAgent: string | null) {
  if (!userAgent) return "Unknown device";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown device";
}

export async function listSessions(userId: string, currentSessionId: string) {
  const now = new Date();
  const sessions = await prisma.authSession.findMany({
    where: {
      userId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: [{ lastSeenAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      lastSeenAt: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    browser: browserName(session.userAgent),
    device: osName(session.userAgent),
    ipAddress: session.ipAddress,
    lastSeenAt: session.lastSeenAt,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    current: session.id === currentSessionId,
  }));
}

export async function revokeSession(userId: string, currentSessionId: string, targetSessionId: string) {
  if (targetSessionId === currentSessionId) {
    throw new AppError("Use Sign out to end your current session.", 400);
  }

  const result = await prisma.authSession.updateMany({
    where: {
      id: targetSessionId,
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  if (!result.count) throw new AppError("Session not found.", 404);
  return { ok: true };
}

export async function revokeOtherSessions(userId: string, currentSessionId: string) {
  const result = await prisma.authSession.updateMany({
    where: {
      userId,
      id: { not: currentSessionId },
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });

  return { ok: true, revoked: result.count };
}
