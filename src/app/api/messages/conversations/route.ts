import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const me = await requireUser(request);

    if (!me) {
      return jsonError("Unauthorized.", 401);
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          {
            requesterId: me.id,
          },
          {
            addresseeId: me.id,
          },
        ],
      },

      include: {
        requester: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },

        addressee: {
          select: {
            id: true,
            name: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    const conversations = await Promise.all(
      friendships.map(async (friendship) => {
        const friend =
          friendship.requesterId === me.id
            ? friendship.addressee
            : friendship.requester;

        const [lastMessage, unreadCount] = await Promise.all([
          prisma.directMessage.findFirst({
            where: {
              OR: [
                {
                  senderId: me.id,
                  receiverId: friend.id,
                },
                {
                  senderId: friend.id,
                  receiverId: me.id,
                },
              ],
            },

            orderBy: {
              createdAt: "desc",
            },
          }),

          prisma.directMessage.count({
            where: {
              senderId: friend.id,
              receiverId: me.id,
              isRead: false,
            },
          }),
        ]);

        return {
          friend,
          lastMessage,
          unreadCount,
        };
      })
    );

    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt
        ? new Date(a.lastMessage.createdAt).getTime()
        : 0;

      const bTime = b.lastMessage?.createdAt
        ? new Date(b.lastMessage.createdAt).getTime()
        : 0;

      return bTime - aTime;
    });

    return NextResponse.json({
      conversations,
    });
  } catch (error) {
    console.error(
      "GET /api/messages/conversations:",
      error
    );

    return safeError(error);
  }
}