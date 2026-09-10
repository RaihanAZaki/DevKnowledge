import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { canManage, requireUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
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
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const thread = await prisma.forumThread.findUnique({
      where: {
        id,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },

          orderBy: [
            {
              isAccepted: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },
    });

    if (!thread) {
      return jsonError("Discussion not found.", 404);
    }

    return NextResponse.json({
      thread,
      canManage: canManage(thread.authorId, user),
      currentUserId: user.id,
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const current = await prisma.forumThread.findUnique({
      where: {
        id,
      },

      select: {
        authorId: true,
        title: true,
      },
    });

    if (!current) {
      return jsonError("Discussion not found.", 404);
    }

    if (!canManage(current.authorId, user)) {
      return jsonError("Forbidden.", 403);
    }

    await prisma.forumThread.delete({
      where: {
        id,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "DELETE",
      entity: "FORUM",
      entityId: id,
      description: `Deleted discussion "${current.title}".`,
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return safeError(error);
  }
}