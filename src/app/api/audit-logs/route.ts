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

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);

    if (!user) {
      return jsonError("Unauthorized.", 401);
    }

    const search =
      request.nextUrl.searchParams
        .get("search")
        ?.trim() ?? "";

    const action =
      request.nextUrl.searchParams
        .get("action")
        ?.trim()
        .toUpperCase() ?? "";

    const entity =
      request.nextUrl.searchParams
        .get("entity")
        ?.trim()
        .toUpperCase() ?? "";

    const pageParam = Number(
      request.nextUrl.searchParams.get("page")
    );

    const limitParam = Number(
      request.nextUrl.searchParams.get("limit")
    );

    const page =
      Number.isFinite(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isFinite(limitParam) && limitParam > 0
        ? Math.min(limitParam, 100)
        : 20;

    const skip = (page - 1) * limit;

    const validAction = ACTIONS.includes(
      action as (typeof ACTIONS)[number]
    )
      ? action
      : null;

    const validEntity = ENTITIES.includes(
      entity as (typeof ENTITIES)[number]
    )
      ? entity
      : null;

    const where: any = {};

    if (validAction) {
      where.action = validAction;
    }

    if (validEntity) {
      where.entity = validEntity;
    }

    if (search) {
      where.OR = [
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          entityId: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
        {
          user: {
            email: {
              contains: search,
              mode: "insensitive",
            },
          },
        },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        skip,
        take: limit,
      }),

      prisma.auditLog.count({
        where,
      }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/audit-logs ERROR:", error);

    return safeError(error);
  }
}