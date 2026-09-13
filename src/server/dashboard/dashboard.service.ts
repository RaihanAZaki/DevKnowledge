import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function accessibleDocumentWhere(userId: string) {
  return {
    OR: [
      { authorId: userId },
      { visibility: "PUBLIC" as const, isPublished: true },
      { sharedWith: { some: { userId } } },
    ],
  };
}

export async function getDashboardData(user: Pick<SessionUser, "id" | "role">) {
  const accessibleDocuments = accessibleDocumentWhere(user.id);

  const [
    snippets,
    documents,
    threads,
    mySnippets,
    myDocuments,
    myThreads,
    unreadNotifications,
    unreadDirectMessages,
    memberships,
    pendingFriendRequests,
    bookmarks,
    reputation,
    reputationThisWeek,
    recentSnippets,
    recentDocuments,
    recentThreads,
    recentActivity,
    unresolvedThreadCount,
    openThreads,
  ] = await Promise.all([
    prisma.codeSnippet.count(),
    prisma.documentation.count({ where: accessibleDocuments }),
    prisma.forumThread.count(),
    prisma.codeSnippet.count({ where: { authorId: user.id } }),
    prisma.documentation.count({ where: { authorId: user.id } }),
    prisma.forumThread.count({ where: { authorId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    prisma.directMessage.count({ where: { receiverId: user.id, isRead: false } }),
    prisma.chatGroupMember.findMany({
      where: { userId: user.id },
      select: { groupId: true, lastReadAt: true },
    }),
    prisma.friendship.count({ where: { addresseeId: user.id, status: "PENDING" } }),
    prisma.bookmark.count({ where: { userId: user.id } }),
    prisma.userReputation.findUnique({ where: { userId: user.id }, select: { score: true } }),
    prisma.reputationHistory.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      _sum: { points: true },
    }),
    prisma.codeSnippet.findMany({
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, ticketNo: true, language: true, updatedAt: true },
    }),
    prisma.documentation.findMany({
      take: 4,
      where: accessibleDocuments,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, language: true, visibility: true, updatedAt: true },
    }),
    prisma.forumThread.findMany({
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, category: true, updatedAt: true },
    }),
    prisma.auditLog.findMany({
      where: user.role === "ADMIN" ? undefined : { userId: user.id },
      take: 6,
      orderBy: { createdAt: "desc" },
      select: { id: true, action: true, entity: true, entityId: true, description: true, createdAt: true },
    }),
    prisma.forumThread.count({
      where: {
        authorId: user.id,
        comments: { none: { isAccepted: true } },
      },
    }),
    prisma.forumThread.findMany({
      where: {
        authorId: user.id,
        comments: { none: { isAccepted: true } },
      },
      take: 4,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const groupUnread = memberships.length
    ? await Promise.all(
        memberships.map((membership) =>
          prisma.chatGroupMessage.count({
            where: {
              groupId: membership.groupId,
              senderId: { not: user.id },
              createdAt: { gt: membership.lastReadAt },
            },
          }),
        ),
      ).then((counts) => counts.reduce((sum, count) => sum + count, 0))
    : 0;

  const recent = [
    ...recentSnippets.map((item) => ({
      ...item,
      type: "snippet" as const,
      meta: `${item.ticketNo} · ${item.language}`,
    })),
    ...recentDocuments.map((item) => ({
      ...item,
      type: "document" as const,
      meta: `${item.language}${item.visibility === "PRIVATE" ? " · Private" : ""}`,
    })),
    ...recentThreads.map((item) => ({
      ...item,
      type: "forum" as const,
      meta: item.category,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 5);

  return {
    stats: { snippets, documents, threads },
    mine: { snippets: mySnippets, documents: myDocuments, threads: myThreads },
    attention: {
      unreadNotifications,
      unreadDirectMessages,
      unreadGroupMessages: groupUnread,
      pendingFriendRequests,
      unresolvedThreads: unresolvedThreadCount,
    },
    productivity: {
      bookmarks,
      reputation: reputation?.score ?? 0,
      reputationThisWeek: reputationThisWeek._sum.points ?? 0,
    },
    recent,
    recentActivity,
    openThreads,
  };
}
