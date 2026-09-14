import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

export type UpdateUserPreferencesInput = {
  theme?: "SYSTEM" | "LIGHT" | "DARK";
  compactMode?: boolean;

  notifyFriendRequests?: boolean;
  notifyMentions?: boolean;
  notifyGroupMessages?: boolean;
  notifyForumReplies?: boolean;
  notifyAcceptedAnswers?: boolean;
  notifyReputation?: boolean;

  showOnlineStatus?: boolean;
  readReceipts?: boolean;
  messageSounds?: boolean;
  desktopNotifications?: boolean;
};

const preferenceSelect = {
  id: true,

  theme: true,
  compactMode: true,

  notifyFriendRequests: true,
  notifyMentions: true,
  notifyGroupMessages: true,
  notifyForumReplies: true,
  notifyAcceptedAnswers: true,
  notifyReputation: true,

  showOnlineStatus: true,
  readReceipts: true,
  messageSounds: true,
  desktopNotifications: true,

  createdAt: true,
  updatedAt: true,
};

export async function getUserSettings(
  userId: string,
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      id: true,
      email: true,
      role: true,

      preferences: {
        select: preferenceSelect,
      },
    },
  });

  if (!user) {
    throw new AppError(
      "User not found.",
      404,
    );
  }

  let preferences =
    user.preferences;

  if (!preferences) {
    preferences =
      await prisma.userPreference.create({
        data: {
          userId,
        },

        select: preferenceSelect,
      });
  }

  return {
    account: {
      email: user.email,
      role: user.role,
    },

    preferences,
  };
}

export async function updateUserSettings({
  userId,
  data,
}: {
  userId: string;
  data: UpdateUserPreferencesInput;
}) {
  const allowedTheme =
    data.theme === undefined ||
    data.theme === "SYSTEM" ||
    data.theme === "LIGHT" ||
    data.theme === "DARK";

  if (!allowedTheme) {
    throw new AppError(
      "Invalid theme.",
      400,
    );
  }

  return prisma.userPreference.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      ...(data.theme !== undefined
        ? { theme: data.theme }
        : {}),

      ...(data.compactMode !== undefined
        ? {
            compactMode:
              data.compactMode,
          }
        : {}),

      ...(data.notifyFriendRequests !==
      undefined
        ? {
            notifyFriendRequests:
              data.notifyFriendRequests,
          }
        : {}),

      ...(data.notifyMentions !== undefined
        ? {
            notifyMentions:
              data.notifyMentions,
          }
        : {}),

      ...(data.notifyGroupMessages !==
      undefined
        ? {
            notifyGroupMessages:
              data.notifyGroupMessages,
          }
        : {}),

      ...(data.notifyForumReplies !==
      undefined
        ? {
            notifyForumReplies:
              data.notifyForumReplies,
          }
        : {}),

      ...(data.notifyAcceptedAnswers !==
      undefined
        ? {
            notifyAcceptedAnswers:
              data.notifyAcceptedAnswers,
          }
        : {}),

      ...(data.notifyReputation !== undefined
        ? {
            notifyReputation:
              data.notifyReputation,
          }
        : {}),

      ...(data.showOnlineStatus !== undefined
        ? {
            showOnlineStatus:
              data.showOnlineStatus,
          }
        : {}),

      ...(data.readReceipts !== undefined
        ? {
            readReceipts:
              data.readReceipts,
          }
        : {}),

      ...(data.messageSounds !== undefined
        ? {
            messageSounds:
              data.messageSounds,
          }
        : {}),

      ...(data.desktopNotifications !==
      undefined
        ? {
            desktopNotifications:
              data.desktopNotifications,
          }
        : {}),
    },

    update: {
      ...(data.theme !== undefined
        ? { theme: data.theme }
        : {}),

      ...(data.compactMode !== undefined
        ? {
            compactMode:
              data.compactMode,
          }
        : {}),

      ...(data.notifyFriendRequests !==
      undefined
        ? {
            notifyFriendRequests:
              data.notifyFriendRequests,
          }
        : {}),

      ...(data.notifyMentions !== undefined
        ? {
            notifyMentions:
              data.notifyMentions,
          }
        : {}),

      ...(data.notifyGroupMessages !==
      undefined
        ? {
            notifyGroupMessages:
              data.notifyGroupMessages,
          }
        : {}),

      ...(data.notifyForumReplies !==
      undefined
        ? {
            notifyForumReplies:
              data.notifyForumReplies,
          }
        : {}),

      ...(data.notifyAcceptedAnswers !==
      undefined
        ? {
            notifyAcceptedAnswers:
              data.notifyAcceptedAnswers,
          }
        : {}),

      ...(data.notifyReputation !== undefined
        ? {
            notifyReputation:
              data.notifyReputation,
          }
        : {}),

      ...(data.showOnlineStatus !== undefined
        ? {
            showOnlineStatus:
              data.showOnlineStatus,
          }
        : {}),

      ...(data.readReceipts !== undefined
        ? {
            readReceipts:
              data.readReceipts,
          }
        : {}),

      ...(data.messageSounds !== undefined
        ? {
            messageSounds:
              data.messageSounds,
          }
        : {}),

      ...(data.desktopNotifications !==
      undefined
        ? {
            desktopNotifications:
              data.desktopNotifications,
          }
        : {}),
    },

    select: preferenceSelect,
  });
}