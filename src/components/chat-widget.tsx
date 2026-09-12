"use client";

import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Crown,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Send,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  initials,
} from "@/lib/format";

type Friend = {
  id: string;
  name: string;
  role: string;
  avatarUrl:
    | string
    | null;
  email?: string;
};

type DirectMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
};

type Conversation = {
  friend: Friend;
  lastMessage:
    | DirectMessage
    | null;
  unreadCount: number;
};

type GroupMessage = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;

  sender: {
    id: string;
    name: string;
    avatarUrl:
      | string
      | null;
  };
};

type Group = {
  id: string;
  name: string;

  avatarUrl:
    | string
    | null;

  description?:
    | string
    | null;

  ownerId?: string;

  unreadCount: number;

  _count?: {
    members: number;
    messages: number;
  };

  messages?: GroupMessage[];
};

type GroupMember = {
  id: string;
  userId: string;

  role:
    | "OWNER"
    | "ADMIN"
    | "MEMBER";

  joinedAt: string;

  user: {
    id: string;
    name: string;
    email: string;

    avatarUrl:
      | string
      | null;

    role?: string;
  };
};

type GroupDetail = {
  group: {
    id: string;
    name: string;

    description:
      | string
      | null;

    avatarUrl:
      | string
      | null;

    ownerId: string;

    members:
      GroupMember[];

    _count: {
      members: number;
      messages: number;
    };
  };

  currentUserId: string;

  currentRole:
    | "OWNER"
    | "ADMIN"
    | "MEMBER";

  canManage: boolean;
  isOwner: boolean;
};

type View =
  | "list"
  | "direct"
  | "group"
  | "group-detail"
  | "add-members"
  | "create-group";

export default function ChatWidget() {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    view,
    setView,
  ] =
    useState<View>(
      "list",
    );

  const [
    conversations,
    setConversations,
  ] =
    useState<
      Conversation[]
    >([]);

  const [
    groups,
    setGroups,
  ] =
    useState<
      Group[]
    >([]);

  const [
    selectedFriend,
    setSelectedFriend,
  ] =
    useState<
      Friend | null
    >(null);

  const [
    selectedGroup,
    setSelectedGroup,
  ] =
    useState<
      Group | null
    >(null);

  const [
    groupDetail,
    setGroupDetail,
  ] =
    useState<
      GroupDetail | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<
      DirectMessage[]
    >([]);

  const [
    groupMessages,
    setGroupMessages,
  ] =
    useState<
      GroupMessage[]
    >([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState("");

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    groupName,
    setGroupName,
  ] =
    useState("");

  const [
    selectedMembers,
    setSelectedMembers,
  ] =
    useState<
      string[]
    >([]);

  const [
    creatingGroup,
    setCreatingGroup,
  ] =
    useState(false);

  const [
    groupError,
    setGroupError,
  ] =
    useState<
      string | null
    >(null);

  const [
    friends,
    setFriends,
  ] =
    useState<
      Friend[]
    >([]);

  const [
    addMemberIds,
    setAddMemberIds,
  ] =
    useState<
      string[]
    >([]);

  const [
    addingMembers,
    setAddingMembers,
  ] =
    useState(false);

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] =
    useState(false);

  const [
    memberActionId,
    setMemberActionId,
  ] =
    useState<
      string | null
    >(null);

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  const avatarInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  /*
   * =========================
   * LOAD CONVERSATIONS
   * =========================
   */

  const loadConversations =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/messages/conversations",
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          setConversations(
            data.conversations ??
              [],
          );
        } catch (
          error
        ) {
          console.error(
            "Load conversations:",
            error,
          );
        }
      },
      [],
    );

  /*
   * =========================
   * LOAD GROUPS
   * =========================
   */

  const loadGroups =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/messages/groups",
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          setGroups(
            data.groups ??
              [],
          );
        } catch (
          error
        ) {
          console.error(
            "Load groups:",
            error,
          );
        }
      },
      [],
    );

  /*
   * =========================
   * FRIENDS
   * =========================
   */

  const loadFriends =
    useCallback(
      async () => {
        try {
          const response =
            await fetch(
              "/api/messages/groups/friends",
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          setFriends(
            data.friends ??
              [],
          );
        } catch (
          error
        ) {
          console.error(
            "Load friends:",
            error,
          );
        }
      },
      [],
    );

  /*
   * =========================
   * GROUP DETAIL
   * =========================
   */

  const loadGroupDetail =
    useCallback(
      async (
        groupId: string,
      ) => {
        try {
          const response =
            await fetch(
              `/api/messages/groups/${groupId}`,
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          setGroupDetail(
            data,
          );

          setCurrentUserId(
            data.currentUserId ??
              "",
          );

          if (
            data.group
          ) {
            setSelectedGroup(
              (
                current,
              ) => ({
                id:
                  data.group
                    .id,

                name:
                  data.group
                    .name,

                avatarUrl:
                  data.group
                    .avatarUrl,

                description:
                  data.group
                    .description,

                ownerId:
                  data.group
                    .ownerId,

                unreadCount:
                  current?.unreadCount ??
                  0,

                _count:
                  data.group
                    ._count,

                messages:
                  current?.messages ??
                  [],
              }),
            );
          }
        } catch (
          error
        ) {
          console.error(
            "Load group detail:",
            error,
          );
        }
      },
      [],
    );

  /*
   * =========================
   * DIRECT MESSAGE
   * =========================
   */

  const loadMessages =
    useCallback(
      async (
        friendId: string,
      ) => {
        try {
          const response =
            await fetch(
              `/api/messages/${friendId}`,
              {
                cache:
                  "no-store",
              },
            );

          if (
            !response.ok
          ) {
            return;
          }

          const data =
            await response.json();

          setMessages(
            data.messages ??
              [],
          );

          setCurrentUserId(
            data.currentUserId ??
              "",
          );

          await loadConversations();

          window.setTimeout(
            () => {
              bottomRef.current?.scrollIntoView(
                {
                  behavior:
                    "smooth",
                },
              );
            },
            50,
          );
        } catch (
          error
        ) {
          console.error(
            "Load direct messages:",
            error,
          );
        }
      },
      [
        loadConversations,
      ],
    );

  /*
   * =========================
   * GROUP MESSAGE
   * =========================
   */

  const loadGroupMessages =
    useCallback(
      async (
        groupId: string,
      ) => {
        try {
          const [
            detailResponse,
            messageResponse,
          ] =
            await Promise.all([
              fetch(
                `/api/messages/groups/${groupId}`,
                {
                  cache:
                    "no-store",
                },
              ),

              fetch(
                `/api/messages/groups/${groupId}/messages`,
                {
                  cache:
                    "no-store",
                },
              ),
            ]);

          if (
            detailResponse.ok
          ) {
            const detail =
              await detailResponse.json();

            setGroupDetail(
              detail,
            );

            setCurrentUserId(
              detail.currentUserId ??
                "",
            );

            if (
              detail.group
            ) {
              setSelectedGroup(
                (
                  current,
                ) => ({
                  id:
                    detail.group
                      .id,

                  name:
                    detail.group
                      .name,

                  avatarUrl:
                    detail.group
                      .avatarUrl,

                  description:
                    detail.group
                      .description,

                  ownerId:
                    detail.group
                      .ownerId,

                  unreadCount:
                    0,

                  _count:
                    detail.group
                      ._count,

                  messages:
                    current
                      ?.messages ??
                    [],
                }),
              );
            }
          }

          if (
            messageResponse.ok
          ) {
            const data =
              await messageResponse.json();

            setGroupMessages(
              data.messages ??
                [],
            );
          }

          await loadGroups();

          window.setTimeout(
            () => {
              bottomRef.current?.scrollIntoView(
                {
                  behavior:
                    "smooth",
                },
              );
            },
            50,
          );
        } catch (
          error
        ) {
          console.error(
            "Load group messages:",
            error,
          );
        }
      },
      [
        loadGroups,
      ],
    );

  /*
   * =========================
   * INITIAL POLLING
   * =========================
   */

  useEffect(() => {
    void loadConversations();
    void loadGroups();

    const interval =
      window.setInterval(
        () => {
          void loadConversations();
          void loadGroups();

          if (
            open &&
            view ===
              "direct" &&
            selectedFriend
          ) {
            void loadMessages(
              selectedFriend.id,
            );
          }

          if (
            open &&
            view ===
              "group" &&
            selectedGroup
          ) {
            void loadGroupMessages(
              selectedGroup.id,
            );
          }
        },
        3000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, [
    open,
    view,
    selectedFriend,
    selectedGroup,
    loadConversations,
    loadGroups,
    loadMessages,
    loadGroupMessages,
  ]);

  /*
   * =========================
   * DIRECT
   * =========================
   */

  async function selectConversation(
    friend: Friend,
  ) {
    setSelectedFriend(
      friend,
    );

    setSelectedGroup(
      null,
    );

    setGroupDetail(
      null,
    );

    setMessage("");

    setView(
      "direct",
    );

    await loadMessages(
      friend.id,
    );
  }

  async function sendDirectMessage() {
    if (
      !selectedFriend ||
      !message.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(
        true,
      );

      const response =
        await fetch(
          `/api/messages/${selectedFriend.id}`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                content:
                  message.trim(),
              }),
          },
        );

      if (
        !response.ok
      ) {
        return;
      }

      setMessage("");

      await loadMessages(
        selectedFriend.id,
      );
    } finally {
      setSending(
        false,
      );
    }
  }

  /*
   * =========================
   * GROUP
   * =========================
   */

  async function selectGroup(
    group: Group,
  ) {
    setSelectedGroup(
      group,
    );

    setSelectedFriend(
      null,
    );

    setMessage("");

    setView(
      "group",
    );

    await loadGroupMessages(
      group.id,
    );
  }

  async function sendGroupMessage() {
    if (
      !selectedGroup ||
      !message.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(
        true,
      );

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/messages`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                content:
                  message.trim(),
              }),
          },
        );

      if (
        !response.ok
      ) {
        return;
      }

      setMessage("");

      await loadGroupMessages(
        selectedGroup.id,
      );
    } finally {
      setSending(
        false,
      );
    }
  }

  /*
   * =========================
   * CREATE GROUP
   * =========================
   */

  function toggleSelectedMember(
    userId: string,
  ) {
    setSelectedMembers(
      (
        current,
      ) =>
        current.includes(
          userId,
        )
          ? current.filter(
              (id) =>
                id !==
                userId,
            )
          : [
              ...current,
              userId,
            ],
    );
  }

  async function createGroup() {
    if (
      groupName
        .trim()
        .length < 2 ||
      selectedMembers.length ===
        0 ||
      creatingGroup
    ) {
      return;
    }

    try {
      setCreatingGroup(
        true,
      );

      setGroupError(
        null,
      );

      const response =
        await fetch(
          "/api/messages/groups",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name:
                  groupName.trim(),

                memberIds:
                  selectedMembers,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to create group.",
        );
      }

      setGroupName(
        "",
      );

      setSelectedMembers(
        [],
      );

      await loadGroups();

      const group: Group =
        {
          id:
            data.group.id,

          name:
            data.group.name,

          avatarUrl:
            data.group.avatarUrl ??
            null,

          description:
            data.group.description,

          unreadCount:
            0,

          _count: {
            members:
              data.group
                .members
                ?.length ??
              1,

            messages:
              0,
          },

          messages:
            [],
        };

      await selectGroup(
        group,
      );
    } catch (
      error
    ) {
      setGroupError(
        error instanceof Error
          ? error.message
          : "Unable to create group.",
      );
    } finally {
      setCreatingGroup(
        false,
      );
    }
  }

  /*
   * =========================
   * GROUP DETAIL
   * =========================
   */

  async function openGroupDetail() {
    if (
      !selectedGroup
    ) {
      return;
    }

    await loadGroupDetail(
      selectedGroup.id,
    );

    setView(
      "group-detail",
    );
  }

  /*
   * =========================
   * AVATAR
   * =========================
   */

  async function uploadGroupAvatar(
    file: File,
  ) {
    if (
      !selectedGroup
    ) {
      return;
    }

    try {
      setUploadingAvatar(
        true,
      );

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/avatar`,
          {
            method:
              "POST",

            body:
              formData,
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to update group photo.",
        );
      }

      await Promise.all([
        loadGroupDetail(
          selectedGroup.id,
        ),

        loadGroups(),
      ]);
    } catch (
      error
    ) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update photo.",
      );
    } finally {
      setUploadingAvatar(
        false,
      );

      if (
        avatarInputRef.current
      ) {
        avatarInputRef.current.value =
          "";
      }
    }
  }

  /*
   * =========================
   * ADMIN
   * =========================
   */

  async function changeMemberRole(
    member: GroupMember,
  ) {
    if (
      !selectedGroup
    ) {
      return;
    }

    try {
      setMemberActionId(
        member.userId,
      );

      const role =
        member.role ===
        "ADMIN"
          ? "MEMBER"
          : "ADMIN";

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/members/${member.userId}/role`,
          {
            method:
              "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                role,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to change role.",
        );
      }

      await loadGroupDetail(
        selectedGroup.id,
      );
    } catch (
      error
    ) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to change role.",
      );
    } finally {
      setMemberActionId(
        null,
      );
    }
  }

  /*
   * =========================
   * REMOVE MEMBER
   * =========================
   */

  async function removeMember(
    member: GroupMember,
  ) {
    if (
      !selectedGroup
    ) {
      return;
    }

    try {
      setMemberActionId(
        member.userId,
      );

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/members`,
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                memberId:
                  member.userId,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to remove member.",
        );
      }

      await Promise.all([
        loadGroupDetail(
          selectedGroup.id,
        ),

        loadGroups(),
      ]);
    } catch (
      error
    ) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to remove member.",
      );
    } finally {
      setMemberActionId(
        null,
      );
    }
  }

  /*
   * =========================
   * ADD MEMBER
   * =========================
   */

  async function openAddMembers() {
    await loadFriends();

    setAddMemberIds(
      [],
    );

    setView(
      "add-members",
    );
  }

  function toggleAddMember(
    userId: string,
  ) {
    setAddMemberIds(
      (
        current,
      ) =>
        current.includes(
          userId,
        )
          ? current.filter(
              (id) =>
                id !==
                userId,
            )
          : [
              ...current,
              userId,
            ],
    );
  }

  async function addMembers() {
    if (
      !selectedGroup ||
      addMemberIds.length ===
        0
    ) {
      return;
    }

    try {
      setAddingMembers(
        true,
      );

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/members`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                memberIds:
                  addMemberIds,
              }),
          },
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ||
            "Unable to add members.",
        );
      }

      setAddMemberIds(
        [],
      );

      await Promise.all([
        loadGroupDetail(
          selectedGroup.id,
        ),

        loadGroups(),
      ]);

      setView(
        "group-detail",
      );
    } catch (
      error
    ) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to add members.",
      );
    } finally {
      setAddingMembers(
        false,
      );
    }
  }

  /*
   * =========================
   * BACK
   * =========================
   */

  function backToList() {
    setView(
      "list",
    );

    setSelectedFriend(
      null,
    );

    setSelectedGroup(
      null,
    );

    setGroupDetail(
      null,
    );

    setMessages(
      [],
    );

    setGroupMessages(
      [],
    );

    setMessage(
      "",
    );
  }

  /*
   * =========================
   * UNREAD
   * =========================
   */

  const directUnread =
    conversations.reduce(
      (
        total,
        conversation,
      ) =>
        total +
        conversation.unreadCount,
      0,
    );

  const groupUnread =
    groups.reduce(
      (
        total,
        group,
      ) =>
        total +
        (group.unreadCount ??
          0),
      0,
    );

  const unreadTotal =
    directUnread +
    groupUnread;

  const existingGroupUserIds =
    new Set(
      groupDetail?.group.members.map(
        (member) =>
          member.userId,
      ) ?? [],
    );

  const availableFriends =
    friends.filter(
      (friend) =>
        !existingGroupUserIds.has(
          friend.id,
        ),
    );

  return (
    <>
      {open && (
        <div
          className="
            fixed
            bottom-24
            right-4
            z-50
            flex
            h-[560px]
            w-[380px]
            flex-col
            overflow-hidden
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            shadow-2xl
            sm:right-6
          "
        >
          {/* LIST */}

          {view ===
            "list" && (
            <>
              <WidgetHeader
                title="Messages"
                subtitle="Chat with your friends"
                right={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Create group"
                      onClick={async () => {
                        await loadFriends();

                        setGroupError(
                          null,
                        );

                        setView(
                          "create-group",
                        );
                      }}
                      className="
                        grid
                        h-9
                        w-9
                        place-items-center
                        rounded-lg
                        text-[var(--text-muted)]
                        transition
                        hover:bg-[var(--surface-hover)]
                        hover:text-[var(--primary)]
                      "
                    >
                      <UsersRound className="h-[18px] w-[18px]" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setOpen(
                          false,
                        )
                      }
                      className="
                        grid
                        h-9
                        w-9
                        place-items-center
                        rounded-lg
                        text-[var(--text-muted)]
                        hover:bg-[var(--surface-hover)]
                      "
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                }
              />

              <div className="flex-1 overflow-y-auto">
                {groups.length >
                  0 && (
                  <>
                    <SectionTitle
                      title="Groups"
                      count={
                        groups.length
                      }
                    />

                    {groups.map(
                      (
                        group,
                      ) => {
                        const lastMessage =
                          group
                            .messages?.[0];

                        return (
                          <button
                            key={
                              group.id
                            }
                            type="button"
                            onClick={() =>
                              void selectGroup(
                                group,
                              )
                            }
                            className="
                              flex
                              w-full
                              items-center
                              gap-3
                              px-4
                              py-3
                              text-left
                              transition
                              hover:bg-[var(--surface-hover)]
                            "
                          >
                            <GroupAvatar
                              name={
                                group.name
                              }
                              avatarUrl={
                                group.avatarUrl
                              }
                            />

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium">
                                {
                                  group.name
                                }
                              </div>

                              <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
                                {lastMessage
                                  ? `${lastMessage.sender.name}: ${lastMessage.content}`
                                  : `${
                                      group
                                        ._count
                                        ?.members ??
                                      0
                                    } members`}
                              </div>
                            </div>

                            {group.unreadCount >
                              0 && (
                              <UnreadBadge
                                value={
                                  group.unreadCount
                                }
                              />
                            )}
                          </button>
                        );
                      },
                    )}

                    <div className="mx-4 border-b border-[var(--border)]" />
                  </>
                )}

                <SectionTitle
                  title="Friends"
                />

                {conversations.length ===
                0 ? (
                  <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-[var(--text-muted)]">
                    Add friends first
                    to start chatting.
                  </div>
                ) : (
                  conversations.map(
                    (
                      conversation,
                    ) => (
                      <button
                        key={
                          conversation
                            .friend
                            .id
                        }
                        type="button"
                        onClick={() =>
                          void selectConversation(
                            conversation.friend,
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-4
                          py-3
                          text-left
                          transition
                          hover:bg-[var(--surface-hover)]
                        "
                      >
                        <Avatar
                          user={
                            conversation.friend
                          }
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {
                              conversation
                                .friend
                                .name
                            }
                          </div>

                          <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
                            {conversation
                              .lastMessage
                              ?.content ??
                              "Start a conversation"}
                          </div>
                        </div>

                        {conversation.unreadCount >
                          0 && (
                          <UnreadBadge
                            value={
                              conversation.unreadCount
                            }
                          />
                        )}
                      </button>
                    ),
                  )
                )}
              </div>
            </>
          )}

          {/* CREATE GROUP */}

          {view ===
            "create-group" && (
            <>
              <BackHeader
                title="New group"
                subtitle="Create a room with your friends"
                onBack={
                  backToList
                }
                onClose={() =>
                  setOpen(
                    false,
                  )
                }
              />

              <div className="flex-1 overflow-y-auto p-4">
                <label className="mb-1.5 block text-xs font-medium">
                  Group name
                </label>

                <input
                  value={
                    groupName
                  }
                  onChange={(
                    event,
                  ) =>
                    setGroupName(
                      event.target
                        .value,
                    )
                  }
                  className="field h-10 w-full px-3 text-sm"
                  placeholder="Backend Team"
                />

                <div className="mt-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium">
                      Members
                    </div>

                    <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                      {
                        selectedMembers.length
                      }{" "}
                      selected
                    </div>
                  </div>

                  <UserPlus className="h-4 w-4 text-[var(--text-muted)]" />
                </div>

                {groupError && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {
                      groupError
                    }
                  </div>
                )}

                <div className="mt-3 space-y-1">
                  {friends.map(
                    (
                      friend,
                    ) => {
                      const checked =
                        selectedMembers.includes(
                          friend.id,
                        );

                      return (
                        <MemberSelectRow
                          key={
                            friend.id
                          }
                          friend={
                            friend
                          }
                          checked={
                            checked
                          }
                          onClick={() =>
                            toggleSelectedMember(
                              friend.id,
                            )
                          }
                        />
                      );
                    },
                  )}
                </div>
              </div>

              <BottomAction>
                <button
                  type="button"
                  disabled={
                    creatingGroup ||
                    groupName
                      .trim()
                      .length <
                      2 ||
                    selectedMembers.length ===
                      0
                  }
                  onClick={() =>
                    void createGroup()
                  }
                  className="
                    inline-flex
                    h-10
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    bg-[var(--primary)]
                    text-sm
                    font-medium
                    text-white
                    disabled:opacity-40
                  "
                >
                  {creatingGroup ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <UsersRound className="h-4 w-4" />
                  )}

                  {creatingGroup
                    ? "Creating..."
                    : "Create group"}
                </button>
              </BottomAction>
            </>
          )}

          {/* DIRECT CHAT */}

          {view ===
            "direct" &&
            selectedFriend && (
              <>
                <BackHeader
                  title={
                    selectedFriend.name
                  }
                  subtitle={
                    selectedFriend.role
                  }
                  avatar={
                    <Avatar
                      user={
                        selectedFriend
                      }
                      small
                    />
                  }
                  onBack={
                    backToList
                  }
                  onClose={() =>
                    setOpen(
                      false,
                    )
                  }
                />

                <ChatBody>
                  {messages.map(
                    (
                      item,
                    ) => (
                      <MessageBubble
                        key={
                          item.id
                        }
                        mine={
                          item.senderId ===
                          currentUserId
                        }
                        content={
                          item.content
                        }
                        createdAt={
                          item.createdAt
                        }
                      />
                    ),
                  )}

                  <div
                    ref={
                      bottomRef
                    }
                  />
                </ChatBody>

                <Composer
                  value={
                    message
                  }
                  sending={
                    sending
                  }
                  onChange={
                    setMessage
                  }
                  onSend={() =>
                    void sendDirectMessage()
                  }
                />
              </>
            )}

          {/* GROUP CHAT */}

          {view ===
            "group" &&
            selectedGroup && (
              <>
                <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
                  <button
                    type="button"
                    onClick={
                      backToList
                    }
                    className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void openGroupDetail()
                    }
                    className="
                      flex
                      min-w-0
                      flex-1
                      items-center
                      gap-2
                      rounded-xl
                      px-1
                      py-1
                      text-left
                      transition
                      hover:bg-[var(--surface-hover)]
                    "
                  >
                    <GroupAvatar
                      name={
                        selectedGroup.name
                      }
                      avatarUrl={
                        selectedGroup.avatarUrl
                      }
                      small
                    />

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">
                        {
                          selectedGroup.name
                        }
                      </div>

                      <div className="text-[11px] text-[var(--text-muted)]">
                        {
                          selectedGroup
                            ._count
                            ?.members ??
                          0
                        }{" "}
                        members
                      </div>
                    </div>

                    <ChevronRight className="mr-1 h-4 w-4 text-[var(--text-muted)]" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setOpen(
                        false,
                      )
                    }
                    className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <ChatBody>
                  {groupMessages.map(
                    (
                      item,
                    ) => {
                      const mine =
                        item.sender.id ===
                        currentUserId;

                      return (
                        <div
                          key={
                            item.id
                          }
                        >
                          {!mine && (
                            <div className="mb-1 ml-1 text-[10px] font-medium text-[var(--text-muted)]">
                              {
                                item.sender
                                  .name
                              }
                            </div>
                          )}

                          <MessageBubble
                            mine={
                              mine
                            }
                            content={
                              item.content
                            }
                            createdAt={
                              item.createdAt
                            }
                          />
                        </div>
                      );
                    },
                  )}

                  <div
                    ref={
                      bottomRef
                    }
                  />
                </ChatBody>

                <Composer
                  value={
                    message
                  }
                  sending={
                    sending
                  }
                  onChange={
                    setMessage
                  }
                  onSend={() =>
                    void sendGroupMessage()
                  }
                />
              </>
            )}

          {/* GROUP DETAIL */}

          {view ===
            "group-detail" &&
            selectedGroup &&
            groupDetail && (
              <>
                <BackHeader
                  title="Group details"
                  subtitle={
                    groupDetail
                      .currentRole
                  }
                  onBack={() =>
                    setView(
                      "group",
                    )
                  }
                  onClose={() =>
                    setOpen(
                      false,
                    )
                  }
                />

                <div className="flex-1 overflow-y-auto">
                  <div className="border-b border-[var(--border)] px-4 py-6 text-center">
                    <div className="relative mx-auto w-fit">
                      <GroupAvatar
                        name={
                          groupDetail
                            .group
                            .name
                        }
                        avatarUrl={
                          groupDetail
                            .group
                            .avatarUrl
                        }
                        large
                      />

                      {groupDetail.canManage && (
                        <button
                          type="button"
                          disabled={
                            uploadingAvatar
                          }
                          onClick={() =>
                            avatarInputRef.current?.click()
                          }
                          className="
                            absolute
                            -bottom-1
                            -right-1
                            grid
                            h-8
                            w-8
                            place-items-center
                            rounded-full
                            border
                            border-[var(--border)]
                            bg-[var(--surface)]
                            text-[var(--primary)]
                            shadow-md
                          "
                        >
                          {uploadingAvatar ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}

                      <input
                        ref={
                          avatarInputRef
                        }
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(
                          event,
                        ) => {
                          const file =
                            event.target
                              .files?.[0];

                          if (
                            file
                          ) {
                            void uploadGroupAvatar(
                              file,
                            );
                          }
                        }}
                      />
                    </div>

                    <h2 className="mt-4 text-base font-semibold">
                      {
                        groupDetail
                          .group
                          .name
                      }
                    </h2>

                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {
                        groupDetail
                          .group
                          ._count
                          .members
                      }{" "}
                      members
                    </p>

                    {groupDetail
                      .group
                      .description && (
                      <p className="mx-auto mt-3 max-w-xs text-xs leading-5 text-[var(--text-muted)]">
                        {
                          groupDetail
                            .group
                            .description
                        }
                      </p>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold">
                          Members
                        </h3>

                        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                          {
                            groupDetail
                              .group
                              .members
                              .length
                          }{" "}
                          people
                        </p>
                      </div>

                      {groupDetail.canManage && (
                        <button
                          type="button"
                          onClick={() =>
                            void openAddMembers()
                          }
                          className="
                            inline-flex
                            h-8
                            items-center
                            gap-1.5
                            rounded-lg
                            border
                            border-[var(--border)]
                            px-2.5
                            text-xs
                            font-medium
                            transition
                            hover:border-[var(--primary)]
                            hover:bg-[var(--primary)]
                            hover:text-white
                          "
                        >
                          <UserPlus className="h-3.5 w-3.5" />

                          Add
                        </button>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      {groupDetail.group.members.map(
                        (
                          member,
                        ) => {
                          const loading =
                            memberActionId ===
                            member.userId;

                          const canRemove =
                            groupDetail.canManage &&
                            member.role !==
                              "OWNER" &&
                            !(
                              groupDetail.currentRole ===
                                "ADMIN" &&
                              member.role !==
                                "MEMBER"
                            );

                          return (
                            <div
                              key={
                                member.id
                              }
                              className="
                                flex
                                items-center
                                gap-3
                                rounded-xl
                                px-2
                                py-2.5
                                transition
                                hover:bg-[var(--surface-soft)]
                              "
                            >
                              <Avatar
                                user={{
                                  id:
                                    member
                                      .user
                                      .id,

                                  name:
                                    member
                                      .user
                                      .name,

                                  role:
                                    member.role,

                                  avatarUrl:
                                    member
                                      .user
                                      .avatarUrl,
                                }}
                                small
                              />

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate text-sm font-medium">
                                    {
                                      member
                                        .user
                                        .name
                                    }
                                  </span>

                                  {member.role ===
                                    "OWNER" && (
                                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                                  )}

                                  {member.role ===
                                    "ADMIN" && (
                                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--primary)]" />
                                  )}
                                </div>

                                <div className="mt-0.5 text-[10px] text-[var(--text-muted)]">
                                  {
                                    member.role
                                  }
                                </div>
                              </div>

                              {loading ? (
                                <LoaderCircle className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  {groupDetail.isOwner &&
                                    member.role !==
                                      "OWNER" && (
                                    <button
                                      type="button"
                                      title={
                                        member.role ===
                                        "ADMIN"
                                          ? "Remove admin"
                                          : "Make admin"
                                      }
                                      onClick={() =>
                                        void changeMemberRole(
                                          member,
                                        )
                                      }
                                      className="
                                        grid
                                        h-8
                                        w-8
                                        place-items-center
                                        rounded-lg
                                        text-[var(--text-muted)]
                                        transition
                                        hover:bg-[var(--primary-soft)]
                                        hover:text-[var(--primary)]
                                      "
                                    >
                                      <ShieldCheck className="h-4 w-4" />
                                    </button>
                                  )}

                                  {canRemove && (
                                    <button
                                      type="button"
                                      title="Remove member"
                                      onClick={() =>
                                        void removeMember(
                                          member,
                                        )
                                      }
                                      className="
                                        grid
                                        h-8
                                        w-8
                                        place-items-center
                                        rounded-lg
                                        text-[var(--text-muted)]
                                        transition
                                        hover:bg-red-50
                                        hover:text-red-500
                                      "
                                    >
                                      <UserMinus className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

          {/* ADD MEMBERS */}

          {view ===
            "add-members" &&
            selectedGroup &&
            groupDetail && (
              <>
                <BackHeader
                  title="Add members"
                  subtitle="Only your friends can be added"
                  onBack={() =>
                    setView(
                      "group-detail",
                    )
                  }
                  onClose={() =>
                    setOpen(
                      false,
                    )
                  }
                />

                <div className="flex-1 overflow-y-auto p-4">
                  {availableFriends.length ===
                  0 ? (
                    <div className="flex min-h-72 items-center justify-center text-center text-sm text-[var(--text-muted)]">
                      All of your
                      friends are already
                      in this group.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {availableFriends.map(
                        (
                          friend,
                        ) => (
                          <MemberSelectRow
                            key={
                              friend.id
                            }
                            friend={
                              friend
                            }
                            checked={
                              addMemberIds.includes(
                                friend.id,
                              )
                            }
                            onClick={() =>
                              toggleAddMember(
                                friend.id,
                              )
                            }
                          />
                        ),
                      )}
                    </div>
                  )}
                </div>

                <BottomAction>
                  <button
                    type="button"
                    disabled={
                      addingMembers ||
                      addMemberIds.length ===
                        0
                    }
                    onClick={() =>
                      void addMembers()
                    }
                    className="
                      inline-flex
                      h-10
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[var(--primary)]
                      text-sm
                      font-medium
                      text-white
                      disabled:opacity-40
                    "
                  >
                    {addingMembers ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}

                    {addingMembers
                      ? "Adding..."
                      : `Add ${
                          addMemberIds.length
                        } member${
                          addMemberIds.length ===
                          1
                            ? ""
                            : "s"
                        }`}
                  </button>
                </BottomAction>
              </>
            )}
        </div>
      )}

      {/* FLOATING BUTTON */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (
              current,
            ) =>
              !current,
          )
        }
        aria-label="Open messages"
        className="
          fixed
          bottom-6
          right-4
          z-50
          grid
          h-14
          w-14
          place-items-center
          rounded-full
          bg-[var(--primary)]
          text-white
          shadow-xl
          transition
          hover:scale-105
          sm:right-6
        "
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}

        {!open &&
          unreadTotal >
            0 && (
            <span
              className="
                absolute
                -right-1
                -top-1
                grid
                h-5
                min-w-5
                place-items-center
                rounded-full
                bg-red-500
                px-1.5
                text-[10px]
                font-bold
                text-white
                ring-2
                ring-[var(--background)]
              "
            >
              {unreadTotal >
              99
                ? "99+"
                : unreadTotal}
            </span>
          )}
      </button>
    </>
  );
}

function WidgetHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
      <div>
        <div className="text-sm font-semibold">
          {title}
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          {subtitle}
        </div>
      </div>

      {right}
    </div>
  );
}

function BackHeader({
  title,
  subtitle,
  avatar,
  onBack,
  onClose,
}: {
  title: string;
  subtitle: string;
  avatar?: React.ReactNode;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--border)] px-3">
      <button
        type="button"
        onClick={onBack}
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {avatar}

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">
          {title}
        </div>

        <div className="truncate text-[11px] text-[var(--text-muted)]">
          {subtitle}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionTitle({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between px-4 pb-1 pt-4">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        {title}
      </span>

      {typeof count ===
        "number" && (
        <span className="text-[10px] text-[var(--text-muted)]">
          {count}
        </span>
      )}
    </div>
  );
}

function ChatBody({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="flex-1 space-y-3 overflow-y-auto bg-[var(--surface-soft)] p-4">
      {children}
    </div>
  );
}

function BottomAction({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-3">
      {children}
    </div>
  );
}

function Composer({
  value,
  sending,
  onChange,
  onSend,
}: {
  value: string;
  sending: boolean;

  onChange: (
    value: string,
  ) => void;

  onSend:
    () => void;
}) {
  return (
    <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex items-end gap-2">
        <textarea
          value={value}
          rows={1}
          placeholder="Write a message..."
          onChange={(
            event,
          ) =>
            onChange(
              event.target
                .value,
            )
          }
          onKeyDown={(
            event,
          ) => {
            if (
              event.key ===
                "Enter" &&
              !event.shiftKey
            ) {
              event.preventDefault();

              onSend();
            }
          }}
          className="field max-h-28 min-h-10 flex-1 resize-none px-3 py-2 text-sm"
        />

        <button
          type="button"
          disabled={
            sending ||
            !value.trim()
          }
          onClick={
            onSend
          }
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-white disabled:opacity-40"
        >
          {sending ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  mine,
  content,
  createdAt,
}: {
  mine: boolean;
  content: string;
  createdAt: string;
}) {
  return (
    <div
      className={`flex ${
        mine
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
          max-w-[78%]
          rounded-2xl
          px-3
          py-2
          text-sm
          leading-5

          ${
            mine
              ? "rounded-br-md bg-[var(--primary)] text-white"
              : "rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
          }
        `}
      >
        {content}

        <div
          className={`
            mt-1
            text-[9px]

            ${
              mine
                ? "text-white/70"
                : "text-[var(--text-muted)]"
            }
          `}
        >
          {new Date(
            createdAt,
          ).toLocaleTimeString(
            [],
            {
              hour:
                "2-digit",

              minute:
                "2-digit",
            },
          )}
        </div>
      </div>
    </div>
  );
}

function MemberSelectRow({
  friend,
  checked,
  onClick,
}: {
  friend: Friend;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="
        flex
        w-full
        items-center
        gap-3
        rounded-xl
        px-2
        py-2
        text-left
        transition
        hover:bg-[var(--surface-hover)]
      "
    >
      <Avatar
        user={
          friend
        }
        small
      />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {
            friend.name
          }
        </div>

        <div className="truncate text-[10px] text-[var(--text-muted)]">
          {friend.email ??
            friend.role}
        </div>
      </div>

      <div
        className={`
          grid
          h-5
          w-5
          shrink-0
          place-items-center
          rounded-md
          border

          ${
            checked
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border-strong)]"
          }
        `}
      >
        {checked && (
          <Check className="h-3 w-3" />
        )}
      </div>
    </button>
  );
}

function UnreadBadge({
  value,
}: {
  value: number;
}) {
  return (
    <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
      {value > 99
        ? "99+"
        : value}
    </span>
  );
}

function Avatar({
  user,
  small = false,
}: {
  user: Friend;
  small?: boolean;
}) {
  const size =
    small
      ? "h-9 w-9"
      : "h-10 w-10";

  if (
    user.avatarUrl
  ) {
    return (
      <img
        src={
          user.avatarUrl
        }
        alt={
          user.name
        }
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`
        grid
        ${size}
        shrink-0
        place-items-center
        rounded-full
        bg-[var(--primary-soft)]
        text-xs
        font-semibold
        text-[var(--primary)]
      `}
    >
      {initials(
        user.name,
      )}
    </div>
  );
}

function GroupAvatar({
  name,
  avatarUrl,
  small = false,
  large = false,
}: {
  name: string;

  avatarUrl?:
    | string
    | null;

  small?: boolean;
  large?: boolean;
}) {
  const size =
    large
      ? "h-20 w-20"
      : small
        ? "h-9 w-9"
        : "h-10 w-10";

  if (
    avatarUrl
  ) {
    return (
      <img
        src={
          avatarUrl
        }
        alt={name}
        className={`${size} shrink-0 rounded-xl object-cover`}
      />
    );
  }

  return (
    <div
      className={`
        grid
        ${size}
        shrink-0
        place-items-center
        rounded-xl
        bg-[var(--primary-soft)]
        text-[var(--primary)]
      `}
    >
      <UsersRound
        className={
          large
            ? "h-7 w-7"
            : "h-4 w-4"
        }
      />
    </div>
  );
}