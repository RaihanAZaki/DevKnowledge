import type {
  SessionUser,
} from "@/lib/auth";

import {
  prisma,
} from "@/lib/prisma";

type ListAuditLogsParams = {
  search?: string;
  action?: string;
  entity?: string;
  page?: number;
  limit?: number;
};

export async function listAuditLogs(
  user: SessionUser,
  params: ListAuditLogsParams,
) {
  const search =
    params.search?.trim() ??
    "";

  const action =
    params.action?.trim() ??
    "";

  const entity =
    params.entity?.trim() ??
    "";

  const page =
    Math.max(
      params.page ?? 1,
      1,
    );

  const limit =
    Math.min(
      Math.max(
        params.limit ?? 20,
        1,
      ),
      100,
    );

  const skip =
    (page - 1) *
    limit;

  const where = {
    // MEMBER hanya boleh lihat log sendiri.
    // ADMIN boleh lihat semuanya.
    ...(user.role !== "ADMIN"
      ? {
          userId:
            user.id,
        }
      : {}),

    ...(action
      ? {
          action,
        }
      : {}),

    ...(entity
      ? {
          entity,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              description: {
                contains:
                  search,

                mode:
                  "insensitive" as const,
              },
            },

            {
              entityId: {
                contains:
                  search,

                mode:
                  "insensitive" as const,
              },
            },

            {
              user: {
                name: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },
            },

            {
              user: {
                email: {
                  contains:
                    search,

                  mode:
                    "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  };

  const [
    logs,
    total,
  ] =
    await Promise.all([
      prisma.auditLog.findMany(
        {
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
            createdAt:
              "desc",
          },

          skip,

          take: limit,
        },
      ),

      prisma.auditLog.count({
        where,
      }),
    ]);

  return {
    logs,

    pagination: {
      page,
      limit,
      total,

      totalPages:
        Math.ceil(
          total /
            limit,
        ),
    },
  };
}