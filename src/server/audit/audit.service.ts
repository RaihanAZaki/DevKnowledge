import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const ACTIONS = ["CREATE", "UPDATE", "DELETE"] as const;
const ENTITIES = ["SNIPPET", "DOCUMENTATION", "FORUM"] as const;

export async function listAuditLogs(params: { search?: string; action?: string; entity?: string; page?: number; limit?: number }) {
  const search = params.search ?? "";
  const action = (params.action ?? "").toUpperCase();
  const entity = (params.entity ?? "").toUpperCase();
  const page = Number.isFinite(params.page) && (params.page ?? 0) > 0 ? params.page! : 1;
  const limit = Number.isFinite(params.limit) && (params.limit ?? 0) > 0 ? Math.min(params.limit!, 100) : 20;
  const validAction = ACTIONS.includes(action as (typeof ACTIONS)[number]) ? action : null;
  const validEntity = ENTITIES.includes(entity as (typeof ENTITIES)[number]) ? entity : null;
  const where: Prisma.AuditLogWhereInput = {};
  if (validAction) where.action = validAction;
  if (validEntity) where.entity = validEntity;
  if (search) {
    where.OR = [
      { description: { contains: search, mode: "insensitive" } },
      { entityId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
