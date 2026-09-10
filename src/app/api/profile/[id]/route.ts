import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const currentUser =
      await requireUser(request);

    if (!currentUser) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const profile =
      await prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          role: true,
          bio: true,
          avatarUrl: true,
          createdAt: true,

          _count: {
            select: {
              snippets: true,
              documents: true,
              threads: true,
            },
          },

          snippets: {
            select: {
              id: true,
              title: true,
              language: true,
              updatedAt: true,
            },

            orderBy: {
              updatedAt: "desc",
            },

            take: 5,
          },

          documents: {
            where: {
              isPublished: true,
            },

            select: {
              id: true,
              title: true,
              language: true,
              updatedAt: true,
            },

            orderBy: {
              updatedAt: "desc",
            },

            take: 5,
          },

          threads: {
            select: {
              id: true,
              title: true,
              updatedAt: true,
            },

            orderBy: {
              updatedAt: "desc",
            },

            take: 5,
          },
        },
      });

    if (!profile) {
      return jsonError(
        "User not found.",
        404
      );
    }

    const friendship =
      currentUser.id === id
        ? null
        : await prisma.friendship.findFirst({
            where: {
              OR: [
                {
                  requesterId:
                    currentUser.id,
                  addresseeId: id,
                },
                {
                  requesterId: id,
                  addresseeId:
                    currentUser.id,
                },
              ],
            },
          });

    let friendshipStatus:
      | "SELF"
      | "NONE"
      | "PENDING_SENT"
      | "PENDING_RECEIVED"
      | "FRIENDS" = "NONE";

    if (currentUser.id === id) {
      friendshipStatus = "SELF";
    } else if (
      friendship?.status === "ACCEPTED"
    ) {
      friendshipStatus = "FRIENDS";
    } else if (
      friendship?.status === "PENDING"
    ) {
      friendshipStatus =
        friendship.requesterId ===
        currentUser.id
          ? "PENDING_SENT"
          : "PENDING_RECEIVED";
    }

    return NextResponse.json({
      profile,
      friendship: friendship
        ? {
            id: friendship.id,
            status: friendshipStatus,
          }
        : {
            id: null,
            status: friendshipStatus,
          },
    });
  } catch (error) {
    return safeError(error);
  }
}