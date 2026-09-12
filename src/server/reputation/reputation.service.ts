import { prisma } from "@/lib/prisma";

export const REPUTATION_POINTS = {
  THREAD_CREATED: 5,
  COMMENT_CREATED: 2,
  ACCEPTED_SOLUTION: 10,
} as const;

export type ReputationAction =
  keyof typeof REPUTATION_POINTS;

type AddReputationParams = {
  userId: string;
  action: ReputationAction;
  referenceId?: string;
};

export async function addReputation({
  userId,
  action,
  referenceId,
}: AddReputationParams) {
  const points = REPUTATION_POINTS[action];

  if (referenceId) {
    const existing =
      await prisma.reputationHistory.findFirst({
        where: {
          userId,
          action,
          referenceId,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return {
        awarded: false,
        points: 0,
      };
    }
  }

  const [, history] =
    await prisma.$transaction([
      prisma.userReputation.upsert({
        where: {
          userId,
        },

        create: {
          userId,
          score: points,
        },

        update: {
          score: {
            increment: points,
          },
        },
      }),

      prisma.reputationHistory.create({
        data: {
          userId,
          action,
          points,
          referenceId:
            referenceId ?? null,
        },
      }),
    ]);

  return {
    awarded: true,
    points,
    history,
  };
}


export async function rewardThreadCreated(
  userId: string,
  threadId: string,
) {
  return addReputation({
    userId,
    action: "THREAD_CREATED",
    referenceId: threadId,
  });
}


export async function rewardCommentCreated(
  userId: string,
  commentId: string,
) {
  return addReputation({
    userId,
    action: "COMMENT_CREATED",
    referenceId: commentId,
  });
}


export async function rewardAcceptedSolution(
  userId: string,
  commentId: string,
) {
  return addReputation({
    userId,
    action: "ACCEPTED_SOLUTION",
    referenceId: commentId,
  });
}


export async function getUserReputation(
  userId: string,
) {
  const reputation =
    await prisma.userReputation.findUnique({
      where: {
        userId,
      },
    });

  return {
    score: reputation?.score ?? 0,
  };
}


export async function getReputationHistory(
  userId: string,
  limit = 20,
) {
  return prisma.reputationHistory.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },

    take: limit,
  });
}

export async function getReputationCardData(
  userId: string,
) {
  const [
    reputation,
    threads,
    replies,
    solved,
  ] = await Promise.all([
    prisma.userReputation.findUnique({
      where: {
        userId,
      },

      select: {
        score: true,
      },
    }),

    prisma.forumThread.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.forumComment.count({
      where: {
        authorId: userId,
      },
    }),

    prisma.forumComment.count({
      where: {
        authorId: userId,
        isAccepted: true,
      },
    }),
  ]);

  return {
    score:
      reputation?.score ?? 0,

    threads,

    replies,

    solved,
  };
}