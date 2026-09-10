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

    const friendship =
      await prisma.friendship.findUnique({
        where: {
          id,
        },
      });

    if (!friendship) {
      return jsonError(
        "Friend request not found.",
        404
      );
    }

    if (
      friendship.addresseeId !== user.id
    ) {
      return jsonError(
        "Forbidden.",
        403
      );
    }

    if (
      friendship.status === "ACCEPTED"
    ) {
      return jsonError(
        "Friend request already accepted.",
        409
      );
    }

    const updated =
      await prisma.friendship.update({
        where: {
          id,
        },

        data: {
          status: "ACCEPTED",
        },
      });

    return NextResponse.json({
      friendship: updated,
    });
  } catch (error) {
    return safeError(error);
  }
}