import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit-logs";

const docSchema = z.object({
  title: z.string().trim().min(3).max(180),

  excerpt: z
    .string()
    .max(500)
    .optional()
    .nullable(),

  content: z
    .string()
    .trim()
    .min(3)
    .max(100000),

  language: z
    .string()
    .trim()
    .min(1)
    .max(50),

  category: z.enum(CATEGORY_OPTIONS),

  tags: z
    .array(
      z.string()
        .trim()
        .min(1)
        .max(40)
    )
    .max(12)
    .default([]),

  isPublished: z
    .boolean()
    .default(true),

  visibility: z
    .enum([
      "PUBLIC",
      "PRIVATE",
    ])
    .default("PUBLIC"),
});

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

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() ?? "";

    const language =
      request.nextUrl.searchParams
        .get("language")
        ?.trim() ?? "";

    const category =
      request.nextUrl.searchParams
        .get("category")
        ?.trim() ?? "";

    const documents =
      await prisma.documentation.findMany({
        where: {
          ...(language
            ? {
                language,
              }
            : {}),

          ...(CATEGORY_OPTIONS.includes(
            category as never
          )
            ? {
                category:
                  category as (typeof CATEGORY_OPTIONS)[number],
              }
            : {}),

          AND: [
            {
              OR: [
                // document milik user sendiri
                {
                  authorId: user.id,
                },

                // document public + published
                {
                  visibility:
                    "PUBLIC",
                  isPublished: true,
                },

                // document private
                // yang dishare ke user
                {
                  visibility:
                    "PRIVATE",

                  sharedWith: {
                    some: {
                      userId:
                        user.id,
                    },
                  },
                },
              ],
            },

            ...(search
              ? [
                  {
                    OR: [
                      {
                        title: {
                          contains:
                            search,
                          mode:
                            "insensitive" as const,
                        },
                      },

                      {
                        content: {
                          contains:
                            search,
                          mode:
                            "insensitive" as const,
                        },
                      },

                      {
                        excerpt: {
                          contains:
                            search,
                          mode:
                            "insensitive" as const,
                        },
                      },
                    ],
                  },
                ]
              : []),
          ],
        },

        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },

          sharedWith: {
            where: {
              userId: user.id,
            },

            select: {
              id: true,
              userId: true,
            },
          },
        },

        orderBy: {
          updatedAt: "desc",
        },
      });

    const result =
      documents.map(
        (document) => ({
          ...document,

          access: {
            isOwner:
              document.authorId ===
              user.id,

            isShared:
              document.sharedWith
                .length > 0,

            isPublic:
              document.visibility ===
                "PUBLIC" &&
              document.isPublished,
          },
        })
      );

    return NextResponse.json({
      documents: result,
    });
  } catch (error) {
    console.error(
      "GET /api/documentation ERROR:",
      error
    );

    return safeError(error);
  }
}

export async function POST(
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

    const parsed =
      docSchema.safeParse(
        await request.json()
      );

    if (!parsed.success) {
      return jsonError(
        "Invalid document data.",
        422,
        parsed.error.flatten()
      );
    }

    const document =
      await prisma.documentation.create({
        data: {
          ...parsed.data,

          excerpt:
            parsed.data.excerpt ||
            null,

          authorId: user.id,
        },

        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      });

    await createAuditLog({
      userId: user.id,

      action: "CREATE",

      entity:
        "DOCUMENTATION",

      entityId: document.id,

      description:
        `Created documentation "${document.title}".`,
    });

    return NextResponse.json(
      {
        document,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/documentation ERROR:",
      error
    );

    return safeError(error);
  }
}