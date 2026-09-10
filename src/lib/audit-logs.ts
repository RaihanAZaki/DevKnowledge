import { prisma } from "@/lib/prisma";

type AuditLogInput = {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  entity: "SNIPPET" | "DOCUMENTATION" | "FORUM";
  entityId?: string | null;
  description: string;
};

export async function createAuditLog({
  userId,
  action,
  entity,
  entityId,
  description,
}: AuditLogInput) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId: entityId ?? null,
        description,
      },
    });
  } catch (error) {
    // Audit log jangan sampai membuat transaksi utama gagal.
    console.error("Failed to create audit log:", error);
  }
}