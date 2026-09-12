import type { SessionUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit-logs";
import { CATEGORY_OPTIONS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import { documentAccess } from "./document.permission";
import { withDocumentAccess } from "./document.mapper";
import type { DocumentInput } from "./document.schema";

export async function listDocuments(params: {
  userId: string;
  search?: string;
  language?: string;
  category?: string;
  scope?: string;
}) {
  const { userId, search = "", language = "", category = "", scope = "mine" } = params;
  const scopeFilter = scope === "mine"
    ? { authorId: userId }
    : { visibility: "PUBLIC" as const, isPublished: true, authorId: { not: userId } };

  const documents = await prisma.documentation.findMany({
    where: {
      ...(language ? { language } : {}),
      ...(CATEGORY_OPTIONS.includes(category as never)
        ? { category: category as (typeof CATEGORY_OPTIONS)[number] }
        : {}),
      AND: [
        scopeFilter,
        ...(search
          ? [{
              OR: [
                { title: { contains: search, mode: "insensitive" as const } },
                { content: { contains: search, mode: "insensitive" as const } },
                { excerpt: { contains: search, mode: "insensitive" as const } },
              ],
            }]
          : []),
      ],
    },
    include: {
      author: { select: { id: true, name: true, role: true } },
      sharedWith: { where: { userId }, select: { id: true, userId: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return documents.map((document) => withDocumentAccess(document, userId));
}

export async function createDocument(userId: string, data: DocumentInput) {
  const document = await prisma.documentation.create({
    data: { ...data, excerpt: data.excerpt || null, authorId: userId },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  await createAuditLog({
    userId,
    action: "CREATE",
    entity: "DOCUMENTATION",
    entityId: document.id,
    description: `Created documentation "${document.title}".`,
  });

  return document;
}

export async function getDocumentById(id: string, user: SessionUser) {
  const document = await prisma.documentation.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, role: true } },
      sharedWith: { where: { userId: user.id }, select: { id: true, userId: true } },
    },
  });

  if (!document) throw new AppError("Document not found.", 404);
  const access = documentAccess(document, user);
  if (!access.canView) throw new AppError("Forbidden.", 403);

  return { document, canManage: access.canManage, access: {
    isOwner: access.isOwner,
    isPublic: access.isPublic,
    isShared: access.isShared,
  }};
}

export async function updateDocument(id: string, user: SessionUser, data: DocumentInput) {
  const current = await prisma.documentation.findUnique({ where: { id }, select: { authorId: true } });
  if (!current) throw new AppError("Document not found.", 404);
  const canManage = current.authorId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
  if (!canManage) throw new AppError("Forbidden.", 403);

  const document = await prisma.documentation.update({
    where: { id },
    data: { ...data, excerpt: data.excerpt || null },
    include: { author: { select: { id: true, name: true, role: true } } },
  });

  await createAuditLog({
    userId: user.id,
    action: "UPDATE",
    entity: "DOCUMENTATION",
    entityId: document.id,
    description: `Updated documentation "${document.title}".`,
  });

  return document;
}

export async function deleteDocument(id: string, user: SessionUser) {
  const current = await prisma.documentation.findUnique({ where: { id }, select: { authorId: true, title: true } });
  if (!current) throw new AppError("Document not found.", 404);
  const canManage = current.authorId === user.id || user.role === "ADMIN" || user.role === "MODERATOR";
  if (!canManage) throw new AppError("Forbidden.", 403);

  await prisma.documentation.delete({ where: { id } });
  await createAuditLog({
    userId: user.id,
    action: "DELETE",
    entity: "DOCUMENTATION",
    entityId: id,
    description: `Deleted documentation "${current.title}".`,
  });
}

export async function shareDocument(id: string, ownerId: string, targetUserId: string) {
  const document = await prisma.documentation.findUnique({ where: { id }, select: { id: true, authorId: true } });
  if (!document) throw new AppError("Document not found.", 404);
  if (document.authorId !== ownerId) throw new AppError("Only the owner can share this document.", 403);
  if (targetUserId === ownerId) throw new AppError("You do not need to share a document with yourself.", 400);

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: ownerId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: ownerId },
      ],
    },
  });
  if (!friendship) throw new AppError("Documents can only be shared with friends.", 403);

  return prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: id, userId: targetUserId } },
    update: {},
    create: { documentId: id, userId: targetUserId },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
  });
}

export async function unshareDocument(id: string, ownerId: string, targetUserId: string) {
  const document = await prisma.documentation.findUnique({ where: { id }, select: { authorId: true } });
  if (!document) throw new AppError("Document not found.", 404);
  if (document.authorId !== ownerId) throw new AppError("Forbidden.", 403);
  await prisma.documentShare.deleteMany({ where: { documentId: id, userId: targetUserId } });
}

export async function listDocumentShares(id: string, ownerId: string) {
  const document = await prisma.documentation.findUnique({
    where: { id },
    select: {
      authorId: true,
      sharedWith: {
        include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
      },
    },
  });
  if (!document) throw new AppError("Document not found.", 404);
  if (document.authorId !== ownerId) throw new AppError("Forbidden.", 403);
  return document.sharedWith;
}
