import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export type KnowledgeType = "SNIPPET" | "DOCUMENTATION" | "FORUM";

export type KnowledgeAttachmentInput = {
  type: KnowledgeType;
  id: string;
};

function normalizeQuery(query?: string) {
  return query?.trim().slice(0, 80) ?? "";
}

export async function listShareableKnowledge(userId: string, query?: string) {
  const q = normalizeQuery(query);
  const contains = q ? { contains: q, mode: "insensitive" as const } : undefined;

  const [snippets, documents, threads] = await Promise.all([
    prisma.codeSnippet.findMany({
      where: contains ? { OR: [{ title: contains }, { ticketNo: contains }] } : undefined,
      select: { id: true, title: true, ticketNo: true, language: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.documentation.findMany({
      where: {
        isPublished: true,
        AND: [
          {
            OR: [
              { visibility: "PUBLIC" },
              { authorId: userId },
              { sharedWith: { some: { userId } } },
            ],
          },
          ...(contains ? [{ OR: [{ title: contains }, { excerpt: contains }] }] : []),
        ],
      },
      select: { id: true, title: true, excerpt: true, language: true, visibility: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
    prisma.forumThread.findMany({
      where: contains ? { title: contains } : undefined,
      select: { id: true, title: true, category: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  return [
    ...snippets.map((item) => ({
      type: "SNIPPET" as const,
      id: item.id,
      title: item.title,
      subtitle: `${item.ticketNo} · ${item.language}`,
      href: `/snippets/${item.id}`,
      updatedAt: item.updatedAt,
    })),
    ...documents.map((item) => ({
      type: "DOCUMENTATION" as const,
      id: item.id,
      title: item.title,
      subtitle: `${item.language} · ${item.visibility === "PRIVATE" ? "Private document" : "Documentation"}`,
      href: `/documentation/${item.id}`,
      updatedAt: item.updatedAt,
    })),
    ...threads.map((item) => ({
      type: "FORUM" as const,
      id: item.id,
      title: item.title,
      subtitle: `Forum · ${item.category}`,
      href: `/forum/${item.id}`,
      updatedAt: item.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 24);
}

async function assertDocumentAccessible(documentId: string, userIds: string[]) {
  const document = await prisma.documentation.findUnique({
    where: { id: documentId },
    select: {
      id: true,
      title: true,
      isPublished: true,
      visibility: true,
      authorId: true,
      sharedWith: { select: { userId: true } },
    },
  });

  if (!document || !document.isPublished) throw new AppError("Documentation not found.", 404);

  if (document.visibility === "PRIVATE") {
    const allowed = new Set([document.authorId, ...document.sharedWith.map((share) => share.userId)]);
    const blocked = userIds.some((id) => !allowed.has(id));
    if (blocked) {
      throw new AppError(
        "This private document is not shared with every chat participant.",
        403,
      );
    }
  }

  return { type: "DOCUMENTATION" as const, id: document.id, title: document.title };
}

export async function resolveKnowledgeAttachment(
  attachment: KnowledgeAttachmentInput | null | undefined,
  participantIds: string[],
) {
  if (!attachment) return null;

  if (attachment.type === "DOCUMENTATION") {
    return assertDocumentAccessible(attachment.id, participantIds);
  }

  if (attachment.type === "SNIPPET") {
    const item = await prisma.codeSnippet.findUnique({
      where: { id: attachment.id },
      select: { id: true, title: true },
    });
    if (!item) throw new AppError("Snippet not found.", 404);
    return { type: "SNIPPET" as const, id: item.id, title: item.title };
  }

  if (attachment.type === "FORUM") {
    const item = await prisma.forumThread.findUnique({
      where: { id: attachment.id },
      select: { id: true, title: true },
    });
    if (!item) throw new AppError("Forum discussion not found.", 404);
    return { type: "FORUM" as const, id: item.id, title: item.title };
  }

  throw new AppError("Unsupported knowledge attachment.", 400);
}
