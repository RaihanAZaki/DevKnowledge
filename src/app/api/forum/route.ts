import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { jsonError, safeError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  title: z.string().trim().min(5).max(180),

  content: z.string().trim().min(5).max(20000),

  category: z.enum(CATEGORY_OPTIONS),

  tags: z
    .array(
      z.string().trim().min(1).max(40)
    )
    .max(8)
    .default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const search =
      request.nextUrl.searchParams.get("search")?.trim() ?? "";

    const category =
      request.nextUrl.searchParams.get("category")?.trim() ?? "";

    const threads = await prisma.forumThread.findMany({
      where: {
        ...(CATEGORY_OPTIONS.includes(category as never)
          ? {
              category:
                category as (typeof CATEGORY_OPTIONS)[number],
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },

        _count: {
          select: {
            comments: true,
          },
        },

        comments: {
          where: {
            isAccepted: true,
          },
          select: {
            id: true,
          },
          take: 1,
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      threads,
    });
  } catch (error) {
    return safeError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const parsed = schema.safeParse(
      await request.json()
    );

    if (!parsed.success) {
      return jsonError(
        "Invalid discussion data.",
        422,
        parsed.error.flatten()
      );
    }

    const thread = await prisma.forumThread.create({
      data: {
        ...parsed.data,
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
      entity: "FORUM",
      entityId: thread.id,
      description: `Created discussion "${thread.title}".`,
    });

    return NextResponse.json(
      {
        thread,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return safeError(error);
  }
}