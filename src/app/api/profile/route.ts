import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
] as const;

const ENTITIES = [
  "SNIPPET",
  "DOCUMENTATION",
  "FORUM",
] as const;

export async function GET(
  request: NextRequest
) {
  try {
    const user =
      await requireUser(request);

    if (!user) {
      return jsonError(
        "Unauthorized.",
        401
      );
    }

    const profile =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          id: true,
          name: true,
          email: true,
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

    return NextResponse.json({
      profile,
    });
  } catch (error) {
    console.error(
      "GET /api/profile ERROR:",
      error
    );

    return safeError(error);
  }
}