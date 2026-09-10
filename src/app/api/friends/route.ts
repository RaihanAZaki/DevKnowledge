import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const [
      friendships,
      incoming,
      outgoing,
    ] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",

          OR: [
            {
              requesterId: user.id,
            },
            {
              addresseeId: user.id,
            },
          ],
        },

        include: {
          requester: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatarUrl: true,
              role: true,
            },
          },

          addressee: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatarUrl: true,
              role: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      }),

      prisma.friendship.findMany({
        where: {
          addresseeId: user.id,
          status: "PENDING",
        },

        include: {
          requester: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatarUrl: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.friendship.findMany({
        where: {
          requesterId: user.id,
          status: "PENDING",
        },

        include: {
          addressee: {
            select: {
              id: true,
              name: true,
              bio: true,
              avatarUrl: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const friends =
      friendships.map((friendship) => ({
        friendshipId:
          friendship.id,

        user:
          friendship.requesterId ===
          user.id
            ? friendship.addressee
            : friendship.requester,
      }));

    return NextResponse.json({
      friends,
      incoming,
      outgoing,
    });
  } catch (error) {
    return safeError(error);
  }
}