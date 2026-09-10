import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

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

    const query =
      request.nextUrl.searchParams
        .get("q")
        ?.trim() ?? "";

    if (query.length < 2) {
      return NextResponse.json({
        snippets: [],
        documents: [],
        threads: [],
      });
    }

    const [
      snippets,
      documents,
      threads,
    ] = await Promise.all([
      prisma.codeSnippet.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              ticketNo: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              reason: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        select: {
          id: true,
          title: true,
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 5,
      }),

      prisma.documentation.findMany({
        where: {
          AND: [
            {
              OR: [
                {
                  isPublished: true,
                },
                {
                  authorId: user.id,
                },
              ],
            },
            {
              OR: [
                {
                  title: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: query,
                    mode: "insensitive",
                  },
                },
              ],
            },
          ],
        },

        select: {
          id: true,
          title: true,
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 5,
      }),

      prisma.forumThread.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: query,
                mode: "insensitive",
              },
            },
          ],
        },

        select: {
          id: true,
          title: true,
        },

        orderBy: {
          updatedAt: "desc",
        },

        take: 5,
      }),
    ]);

    return NextResponse.json({
      snippets,
      documents,
      threads,
    });
  } catch (error) {
    return safeError(error);
  }
}