import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid friend request.",
        422,
        parsed.error.flatten()
      );
    }

    const targetUserId = parsed.data.userId;

    if (targetUserId === user.id) {
      return jsonError(
        "You cannot add yourself.",
        400
      );
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
        },
      });

    if (!targetUser) {
      return jsonError(
        "User not found.",
        404
      );
    }

    const existing =
      await prisma.friendship.findFirst({
        where: {
          OR: [
            {
              requesterId: user.id,
              addresseeId: targetUserId,
            },
            {
              requesterId: targetUserId,
              addresseeId: user.id,
            },
          ],
        },
      });

    if (existing) {
      if (
        existing.status === "ACCEPTED"
      ) {
        return jsonError(
          "You are already friends.",
          409
        );
      }

      return jsonError(
        "Friend request already exists.",
        409
      );
    }

    const friendship =
      await prisma.friendship.create({
        data: {
          requesterId: user.id,
          addresseeId: targetUserId,
        },
      });

    return NextResponse.json(
      {
        friendship,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return safeError(error);
  }
}