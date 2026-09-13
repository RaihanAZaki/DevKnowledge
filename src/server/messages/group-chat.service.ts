import { prisma } from "@/lib/prisma";
import { AppError } from "@/server/shared/app-error";
import { createNotification } from "@/server/notifications/notification.service";
import { resolveKnowledgeAttachment, type KnowledgeAttachmentInput } from "@/server/messages/knowledge-chat.service";


async function createGroupSystemMessage(
  groupId: string,
  senderId: string,
  content: string,
) {
  await prisma.chatGroupMessage.create({
    data: { groupId, senderId, content, kind: "SYSTEM" },
  });
  await prisma.chatGroup.update({
    where: { id: groupId },
    data: { updatedAt: new Date() },
  });
}

async function userName(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });
  return user?.name ?? "Someone";
}

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
                lastSeenAt: true,
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
            lastSeenAt: true,
          },
        },

        addressee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            lastSeenAt: true,
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
              lastSeenAt: true,
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
                lastSeenAt: true,
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
  await requireMembership(groupId, userId);

  await prisma.chatGroupMember.update({
    where: { groupId_userId: { groupId, userId } },
    data: { lastReadAt: new Date() },
  });

  const [messages, members] = await Promise.all([
    prisma.chatGroupMessage.findMany({
      where: { groupId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, lastSeenAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.chatGroupMember.findMany({
      where: { groupId },
      select: {
        userId: true,
        lastReadAt: true,
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  return messages.reverse().map((message) => {
    const readBy = members
      .filter(
        (member) =>
          member.userId !== message.senderId &&
          member.lastReadAt.getTime() >= message.createdAt.getTime(),
      )
      .map((member) => member.user);

    return { ...message, readBy, readByCount: readBy.length };
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function sendGroupMessage({
  groupId,
  senderId,
  content,
  attachment,
}: {
  groupId: string;
  senderId: string;
  content: string;
  attachment?: KnowledgeAttachmentInput | null;
}) {
  const senderMembership = await requireMembership(groupId, senderId);
  const text = content.trim();

  if (!text && !attachment) throw new AppError("Message or knowledge attachment is required.", 400);
  if (text.length > 5000) throw new AppError("Message is too long.", 400);

  const [group, members] = await Promise.all([
    prisma.chatGroup.findUnique({
      where: { id: groupId },
      select: { id: true, name: true },
    }),
    prisma.chatGroupMember.findMany({
      where: { groupId },
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  if (!group) throw new AppError("Group not found.", 404);

  const knowledge = await resolveKnowledgeAttachment(
    attachment,
    members.map((member) => member.userId),
  );

  const message = await prisma.chatGroupMessage.create({
    data: {
      groupId,
      senderId,
      content: text,
      knowledgeType: knowledge?.type ?? null,
      knowledgeId: knowledge?.id ?? null,
      knowledgeTitle: knowledge?.title ?? null,
    },
    include: {
      sender: {
        select: { id: true, name: true, avatarUrl: true, lastSeenAt: true },
      },
    },
  });

  await prisma.chatGroup.update({
    where: { id: groupId },
    data: { updatedAt: new Date() },
  });

  const canMentionEveryone =
    senderMembership.role === "OWNER" || senderMembership.role === "ADMIN";
  const hasEveryone = /(^|\s)@everyone(?=\s|$|[.,!?])/i.test(text);
  const mentioned = new Map<string, { id: string; name: string }>();

  if (hasEveryone && canMentionEveryone) {
    for (const member of members) {
      if (member.userId !== senderId) mentioned.set(member.userId, member.user);
    }
  } else {
    for (const member of members) {
      if (member.userId === senderId) continue;
      const pattern = new RegExp(
        `(^|\\s)@${escapeRegExp(member.user.name)}(?=\\s|$|[.,!?])`,
        "i",
      );
      if (pattern.test(text)) mentioned.set(member.userId, member.user);
    }
  }

  if (mentioned.size > 0) {
    const sender = members.find((member) => member.userId === senderId)?.user;
    await Promise.all(
      [...mentioned.values()].map((mentionedUser) =>
        createNotification({
          userId: mentionedUser.id,
          title: `Mentioned in ${group.name}`,
          message: `${sender?.name ?? "Someone"} mentioned you in a group message.`,
          type: "GROUP_MENTION",
          referenceId: groupId,
        }),
      ),
    );
  }

  return { ...message, readBy: [], readByCount: 0 };
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

  const existing = await prisma.chatGroupMember.findMany({
    where: { groupId, userId: { in: uniqueIds } },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((item) => item.userId));
  const addedIds = uniqueIds.filter((id) => !existingIds.has(id));

  await prisma.chatGroupMember.createMany({
    data: addedIds.map((userId) => ({ groupId, userId, role: "MEMBER" })),
    skipDuplicates: true,
  });

  if (addedIds.length > 0) {
    const [actorName, group, addedUsers] = await Promise.all([
      userName(actorId),
      prisma.chatGroup.findUnique({ where: { id: groupId }, select: { name: true } }),
      prisma.user.findMany({ where: { id: { in: addedIds } }, select: { id: true, name: true } }),
    ]);
    await createGroupSystemMessage(
      groupId,
      actorId,
      `${actorName} added ${addedUsers.map((user) => user.name).join(", ")}.`,
    );
    await Promise.all(
      addedUsers.map((addedUser) =>
        createNotification({
          userId: addedUser.id,
          title: `Added to ${group?.name ?? "a group"}`,
          message: `${actorName} added you to the group.`,
          type: "GROUP_ADDED",
          referenceId: groupId,
        }),
      ),
    );
  }

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

  const [actorName, targetName] = await Promise.all([
    userName(actorId),
    userName(memberId),
  ]);

  await prisma.chatGroupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId: memberId,
      },
    },
  });

  await createGroupSystemMessage(groupId, actorId, `${actorName} removed ${targetName}.`);
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

  const leavingName = await userName(userId);

  await prisma.chatGroupMember.delete({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  await createGroupSystemMessage(groupId, userId, `${leavingName} left the group.`);
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

  const group = await prisma.chatGroup.update({
    where: { id: groupId },
    data: { avatarUrl: dataUrl },
    select: { id: true, name: true, avatarUrl: true },
  });

  const actorName = await userName(userId);
  await createGroupSystemMessage(groupId, userId, `${actorName} changed the group photo.`);
  return group;
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

  const updated = await prisma.chatGroupMember.update({
    where: { groupId_userId: { groupId, userId: memberId } },
    data: { role },
  });

  const [actorName, targetName, group] = await Promise.all([
    userName(actorId),
    userName(memberId),
    prisma.chatGroup.findUnique({ where: { id: groupId }, select: { name: true } }),
  ]);
  const action = role === "ADMIN" ? "made" : "removed";
  const suffix = role === "ADMIN" ? "an admin" : "as admin";
  await createGroupSystemMessage(groupId, actorId, `${actorName} ${action} ${targetName} ${suffix}.`);
  await createNotification({
    userId: memberId,
    title: role === "ADMIN" ? `You are now an admin in ${group?.name ?? "a group"}` : `Admin role updated in ${group?.name ?? "a group"}`,
    message: role === "ADMIN" ? `${actorName} promoted you to group admin.` : `${actorName} removed your group admin role.`,
    type: "GROUP_ROLE",
    referenceId: groupId,
  });
  return updated;
}

export async function updateGroupInfo({
  groupId,
  actorId,
  name,
  description,
}: {
  groupId: string;
  actorId: string;
  name: string;
  description?: string | null;
}) {
  await requireGroupManager(groupId, actorId);
  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 80) {
    throw new AppError("Group name must contain 2-80 characters.", 400);
  }
  const cleanDescription = description?.trim().slice(0, 500) || null;
  const previous = await prisma.chatGroup.findUnique({
    where: { id: groupId },
    select: { name: true, description: true },
  });
  if (!previous) throw new AppError("Group not found.", 404);

  const group = await prisma.chatGroup.update({
    where: { id: groupId },
    data: { name: cleanName, description: cleanDescription },
    select: { id: true, name: true, description: true, avatarUrl: true },
  });
  const actorName = await userName(actorId);
  const changes: string[] = [];
  if (previous.name !== cleanName) changes.push(`renamed the group to ${cleanName}`);
  if ((previous.description ?? null) !== cleanDescription) changes.push("updated the group description");
  if (changes.length > 0) {
    await createGroupSystemMessage(groupId, actorId, `${actorName} ${changes.join(" and ")}.`);
  }
  return group;
}

export async function transferGroupOwnership({
  groupId,
  ownerId,
  newOwnerId,
}: {
  groupId: string;
  ownerId: string;
  newOwnerId: string;
}) {
  const ownerMembership = await requireMembership(groupId, ownerId);
  if (ownerMembership.role !== "OWNER") {
    throw new AppError("Only the group owner can transfer ownership.", 403);
  }
  if (ownerId === newOwnerId) throw new AppError("This user is already the owner.", 400);
  const target = await prisma.chatGroupMember.findUnique({
    where: { groupId_userId: { groupId, userId: newOwnerId } },
  });
  if (!target) throw new AppError("New owner must already be a group member.", 400);

  await prisma.$transaction([
    prisma.chatGroup.update({ where: { id: groupId }, data: { ownerId: newOwnerId } }),
    prisma.chatGroupMember.update({
      where: { groupId_userId: { groupId, userId: ownerId } },
      data: { role: "ADMIN" },
    }),
    prisma.chatGroupMember.update({
      where: { groupId_userId: { groupId, userId: newOwnerId } },
      data: { role: "OWNER" },
    }),
  ]);

  const [oldName, newName, group] = await Promise.all([
    userName(ownerId),
    userName(newOwnerId),
    prisma.chatGroup.findUnique({ where: { id: groupId }, select: { name: true } }),
  ]);
  await createGroupSystemMessage(groupId, ownerId, `${oldName} transferred ownership to ${newName}.`);
  await createNotification({
    userId: newOwnerId,
    title: `You now own ${group?.name ?? "a group"}`,
    message: `${oldName} transferred group ownership to you.`,
    type: "GROUP_OWNER",
    referenceId: groupId,
  });

  return getGroup(groupId, newOwnerId);
}
