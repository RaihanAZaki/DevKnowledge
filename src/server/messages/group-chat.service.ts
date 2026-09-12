import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";

async function requireMembership(
  groupId: string,
  userId: string,
) {
  const member =
    await prisma.chatGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId,
        },
      },
      include: {
        group: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

  if (!member) {
    throw new AppError(
      "Group not found.",
      404,
    );
  }

  return member;
}

async function requireGroupManager(
  groupId: string,
  userId: string,
) {
  const member =
    await requireMembership(
      groupId,
      userId,
    );

  if (
    member.role !== "OWNER" &&
    member.role !== "ADMIN"
  ) {
    throw new AppError(
      "Only group owners or admins can manage members.",
      403,
    );
  }

  return member;
}

export async function listUserGroups(
  userId: string,
) {
  const groups =
    await prisma.chatGroup.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },

          orderBy: {
            joinedAt: "asc",
          },
        },

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,

          include: {
            sender: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
      },
    });

  return Promise.all(
    groups.map(
      async (group) => {
        const membership =
          group.members.find(
            (member) =>
              member.userId ===
              userId,
          );

        const unreadCount =
          membership
            ? await prisma.chatGroupMessage.count({
                where: {
                  groupId:
                    group.id,

                  senderId: {
                    not:
                      userId,
                  },

                  createdAt: {
                    gt:
                      membership.lastReadAt,
                  },
                },
              })
            : 0;

        return {
          ...group,
          unreadCount,
        };
      },
    ),
  );
}

export async function getAcceptedFriends(
  userId: string,
) {
  const friendships =
    await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",

        OR: [
          {
            requesterId: userId,
          },
          {
            addresseeId: userId,
          },
        ],
      },

      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        addressee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

  return friendships.map(
    (friendship) =>
      friendship.requesterId ===
      userId
        ? friendship.addressee
        : friendship.requester,
  );
}

export async function createGroup({
  ownerId,
  name,
  description,
  memberIds,
}: {
  ownerId: string;
  name: string;
  description?: string;
  memberIds: string[];
}) {
  const cleanName =
    name.trim();

  if (
    cleanName.length < 2
  ) {
    throw new AppError(
      "Group name must contain at least 2 characters.",
      400,
    );
  }

  const uniqueMemberIds =
    Array.from(
      new Set(
        memberIds.filter(
          (id) =>
            id !== ownerId,
        ),
      ),
    );

  if (
    uniqueMemberIds.length ===
    0
  ) {
    throw new AppError(
      "Select at least one friend.",
      400,
    );
  }

  const friendships =
    await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",

        OR: [
          {
            requesterId:
              ownerId,

            addresseeId: {
              in: uniqueMemberIds,
            },
          },

          {
            addresseeId:
              ownerId,

            requesterId: {
              in: uniqueMemberIds,
            },
          },
        ],
      },

      select: {
        requesterId: true,
        addresseeId: true,
      },
    });

  const allowedIds =
    new Set<string>();

  for (
    const friendship
    of friendships
  ) {
    if (
      friendship.requesterId ===
      ownerId
    ) {
      allowedIds.add(
        friendship.addresseeId,
      );
    } else {
      allowedIds.add(
        friendship.requesterId,
      );
    }
  }

  const invalidMembers =
    uniqueMemberIds.filter(
      (id) =>
        !allowedIds.has(id),
    );

  if (
    invalidMembers.length >
    0
  ) {
    throw new AppError(
      "One or more selected users are not your friends.",
      403,
    );
  }

  return prisma.chatGroup.create({
    data: {
      name: cleanName,

      description:
        description?.trim() ||
        null,

      ownerId,

      members: {
        create: [
          {
            userId:
              ownerId,
            role: "OWNER",
          },

          ...uniqueMemberIds.map(
            (userId) => ({
              userId,
              role:
                "MEMBER" as const,
            }),
          ),
        ],
      },
    },

    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
      },

      _count: {
        select: {
          members: true,
        },
      },
    },
  });
}

export async function getGroup(
  groupId: string,
  userId: string,
) {
  await requireMembership(
    groupId,
    userId,
  );

  const group =
    await prisma.chatGroup.findUnique({
      where: {
        id: groupId,
      },

      include: {
        owner: {
          select: {
            id: true,
            name: true,
          },
        },

        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },

          orderBy: [
            {
              role: "asc",
            },
            {
              joinedAt:
                "asc",
            },
          ],
        },

        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

  if (!group) {
    throw new AppError(
      "Group not found.",
      404,
    );
  }

  const currentMember =
    group.members.find(
      (member) =>
        member.userId ===
        userId,
    );

  return {
    group,

    currentUserId:
      userId,

    currentRole:
      currentMember?.role ??
      "MEMBER",

    canManage:
      currentMember?.role ===
        "OWNER" ||
      currentMember?.role ===
        "ADMIN",

    isOwner:
      group.ownerId ===
      userId,
  };
}

export async function getGroupMessages(
  groupId: string,
  userId: string,
) {
  await requireMembership(
    groupId,
    userId,
  );

  const messages =
    await prisma.chatGroupMessage.findMany({
      where: {
        groupId,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 100,
    });

  await prisma.chatGroupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },

    data: {
      lastReadAt:
        new Date(),
    },
  });

  return messages.reverse();
}

export async function sendGroupMessage({
  groupId,
  senderId,
  content,
}: {
  groupId: string;
  senderId: string;
  content: string;
}) {
  await requireMembership(
    groupId,
    senderId,
  );

  const text =
    content.trim();

  if (!text) {
    throw new AppError(
      "Message cannot be empty.",
      400,
    );
  }

  if (
    text.length > 5000
  ) {
    throw new AppError(
      "Message is too long.",
      400,
    );
  }

  const message =
    await prisma.chatGroupMessage.create({
      data: {
        groupId,
        senderId,
        content: text,
      },

      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

  await prisma.chatGroup.update({
    where: {
      id: groupId,
    },

    data: {
      updatedAt:
        new Date(),
    },
  });

  return message;
}

export async function addGroupMembers({
  groupId,
  actorId,
  memberIds,
}: {
  groupId: string;
  actorId: string;
  memberIds: string[];
}) {
  await requireGroupManager(
    groupId,
    actorId,
  );

  const uniqueIds =
    Array.from(
      new Set(memberIds),
    ).filter(
      (id) =>
        id !== actorId,
    );

  if (
    uniqueIds.length ===
    0
  ) {
    return [];
  }

  const friends =
    await getAcceptedFriends(
      actorId,
    );

  const friendIds =
    new Set(
      friends.map(
        (friend) =>
          friend.id,
      ),
    );

  const invalid =
    uniqueIds.filter(
      (id) =>
        !friendIds.has(id),
    );

  if (
    invalid.length > 0
  ) {
    throw new AppError(
      "You can only add your friends to the group.",
      403,
    );
  }

  await prisma.chatGroupMember.createMany({
    data:
      uniqueIds.map(
        (userId) => ({
          groupId,
          userId,
          role: "MEMBER",
        }),
      ),

    skipDuplicates: true,
  });

  return prisma.chatGroupMember.findMany({
    where: {
      groupId,
    },

    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });
}

export async function removeGroupMember({
  groupId,
  actorId,
  memberId,
}: {
  groupId: string;
  actorId: string;
  memberId: string;
}) {
  const actor =
    await requireGroupManager(
      groupId,
      actorId,
    );

  const target =
    await prisma.chatGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId:
            memberId,
        },
      },
    });

  if (!target) {
    throw new AppError(
      "Member not found.",
      404,
    );
  }

  if (
    target.role ===
    "OWNER"
  ) {
    throw new AppError(
      "Group owner cannot be removed.",
      400,
    );
  }

  if (
    actor.role ===
      "ADMIN" &&
    target.role ===
      "ADMIN"
  ) {
    throw new AppError(
      "Admins cannot remove another admin.",
      403,
    );
  }

  await prisma.chatGroupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId:
          memberId,
      },
    },
  });
}

export async function leaveGroup(
  groupId: string,
  userId: string,
) {
  const member =
    await requireMembership(
      groupId,
      userId,
    );

  if (
    member.role ===
    "OWNER"
  ) {
    throw new AppError(
      "The group owner cannot leave. Delete the group instead.",
      400,
    );
  }

  await prisma.chatGroupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });
}

export async function deleteGroup(
  groupId: string,
  userId: string,
) {
  const group =
    await prisma.chatGroup.findUnique({
      where: {
        id: groupId,
      },

      select: {
        ownerId: true,
      },
    });

  if (!group) {
    throw new AppError(
      "Group not found.",
      404,
    );
  }

  if (
    group.ownerId !==
    userId
  ) {
    throw new AppError(
      "Only the group owner can delete this group.",
      403,
    );
  }

  await prisma.chatGroup.delete({
    where: {
      id: groupId,
    },
  });
}

export async function markGroupAsRead(
  groupId: string,
  userId: string,
) {
  await requireMembership(
    groupId,
    userId,
  );

  return prisma.chatGroupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },

    data: {
      lastReadAt:
        new Date(),
    },
  });
}

export async function updateGroupAvatar({
  groupId,
  userId,
  file,
}: {
  groupId: string;
  userId: string;
  file: File;
}) {
  await requireGroupManager(
    groupId,
    userId,
  );

  if (
    !file.type.startsWith(
      "image/",
    )
  ) {
    throw new AppError(
      "Only image files are allowed.",
      400,
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (
    !allowedTypes.includes(
      file.type,
    )
  ) {
    throw new AppError(
      "Only JPG, PNG, and WEBP images are allowed.",
      400,
    );
  }

  // Karena image disimpan langsung
  // ke PostgreSQL sebagai Base64.
  const maxSize =
    1024 * 1024;

  if (
    file.size > maxSize
  ) {
    throw new AppError(
      "Maximum group photo size is 1 MB.",
      400,
    );
  }

  const arrayBuffer =
    await file.arrayBuffer();

  const buffer =
    Buffer.from(
      arrayBuffer,
    );

  const base64 =
    buffer.toString(
      "base64",
    );

  const dataUrl =
    `data:${file.type};base64,${base64}`;

  return prisma.chatGroup.update({
    where: {
      id: groupId,
    },

    data: {
      avatarUrl:
        dataUrl,
    },

    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });
}

export async function setGroupMemberRole({
  groupId,
  actorId,
  memberId,
  role,
}: {
  groupId: string;
  actorId: string;
  memberId: string;
  role:
    | "ADMIN"
    | "MEMBER";
}) {
  const actor =
    await requireMembership(
      groupId,
      actorId,
    );

  if (
    actor.role !==
    "OWNER"
  ) {
    throw new AppError(
      "Only the group owner can manage admins.",
      403,
    );
  }

  const target =
    await prisma.chatGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId:
            memberId,
        },
      },
    });

  if (!target) {
    throw new AppError(
      "Member not found.",
      404,
    );
  }

  if (
    target.role ===
    "OWNER"
  ) {
    throw new AppError(
      "Owner role cannot be changed.",
      400,
    );
  }

  return prisma.chatGroupMember.update({
    where: {
      groupId_userId: {
        groupId,
        userId:
          memberId,
      },
    },

    data: {
      role,
    },
  });
}