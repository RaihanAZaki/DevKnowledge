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

    const query =
      request.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({
        users: [],
      });
    }

    const users =
      await prisma.user.findMany({
        where: {
          id: {
            not: user.id,
          },

          OR: [
            {
              name: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        select: {
          id: true,
          name: true,
          role: true,
          bio: true,
          avatarUrl: true,
        },

        orderBy: {
          name: "asc",
        },

        take: 10,
      });

    return NextResponse.json({
      users,
    });
  } catch (error) {
    return safeError(error);
  }
}