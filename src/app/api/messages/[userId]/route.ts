import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    userId: string;
  }>;
};

const schema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export async function GET(
  request: NextRequest,
  context: Context
) {
  try {
    const me = await requireUser(request);

    if (!me) {
      return jsonError("Unauthorized.", 401);
    }

    const { userId } = await context.params;

    if (userId === me.id) {
      return jsonError(
        "You cannot chat with yourself.",
        400
      );
    }

    const friendship =
      await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            {
              requesterId: me.id,
              addresseeId: userId,
            },
            {
              requesterId: userId,
              addresseeId: me.id,
            },
          ],
        },
      });

    if (!friendship) {
      return jsonError(
        "You can only message friends.",
        403
      );
    }

    const friend = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
      },
    });

    if (!friend) {
      return jsonError("User not found.", 404);
    }

    const messages =
      await prisma.directMessage.findMany({
        where: {
          OR: [
            {
              senderId: me.id,
              receiverId: userId,
            },
            {
              senderId: userId,
              receiverId: me.id,
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 200,
      });

    await prisma.directMessage.updateMany({
      where: {
        senderId: userId,
        receiverId: me.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json({
      friend,
      messages,
      currentUserId: me.id,
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: Context
) {
  try {
    const me = await requireUser(request);

    if (!me) {
      return jsonError("Unauthorized.", 401);
    }

    const { userId } = await context.params;

    if (userId === me.id) {
      return jsonError(
        "You cannot message yourself.",
        400
      );
    }

    const friendship =
      await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            {
              requesterId: me.id,
              addresseeId: userId,
            },
            {
              requesterId: userId,
              addresseeId: me.id,
            },
          ],
        },
      });

    if (!friendship) {
      return jsonError(
        "You can only message friends.",
        403
      );
    }

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid message.",
        422,
        parsed.error.flatten()
      );
    }

    const message =
      await prisma.directMessage.create({
        data: {
          senderId: me.id,
          receiverId: userId,
          content: parsed.data.content,
        },
      });

    return NextResponse.json(
      {
        message,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return safeError(error);
  }
}