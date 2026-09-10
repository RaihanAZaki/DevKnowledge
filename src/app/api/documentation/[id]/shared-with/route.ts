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
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const { id } = await context.params;

    const document =
      await prisma.documentation.findUnique({
        where: {
          id,
        },

        select: {
          authorId: true,

          sharedWith: {
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
          },
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

    return NextResponse.json({
      shares: document.sharedWith,
    });
  } catch (error) {
    return safeError(error);
  }
}