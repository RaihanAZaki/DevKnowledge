import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

const schema = z.object({
  userId: z.string().min(1),
});

export async function POST(
  request: NextRequest,
  context: Context
) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid share request.",
        422,
        parsed.error.flatten()
      );
    }

    const document =
      await prisma.documentation.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          authorId: true,
          visibility: true,
        },
      });

    if (!document) {
      return jsonError(
        "Document not found.",
        404
      );
    }

    if (document.authorId !== user.id) {
      return jsonError(
        "Only the owner can share this document.",
        403
      );
    }

    const targetUserId = parsed.data.userId;

    if (targetUserId === user.id) {
      return jsonError(
        "You do not need to share a document with yourself.",
        400
      );
    }

    const friendship =
      await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",

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

    if (!friendship) {
      return jsonError(
        "Documents can only be shared with friends.",
        403
      );
    }

    const share =
      await prisma.documentShare.upsert({
        where: {
          documentId_userId: {
            documentId: id,
            userId: targetUserId,
          },
        },

        update: {},

        create: {
          documentId: id,
          userId: targetUserId,
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

    return NextResponse.json(
      {
        share,
      },
      {
        status: 201,
      }
    );
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

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid unshare request.",
        422
      );
    }

    const document =
      await prisma.documentation.findUnique({
        where: {
          id,
        },

        select: {
          authorId: true,
        },
      });

    if (!document) {
      return jsonError(
        "Document not found.",
        404
      );
    }

    if (document.authorId !== user.id) {
      return jsonError(
        "Forbidden.",
        403
      );
    }

    await prisma.documentShare.deleteMany({
      where: {
        documentId: id,
        userId: parsed.data.userId,
      },
    });

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return safeError(error);
  }
}