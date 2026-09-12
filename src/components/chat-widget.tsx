"use client";

import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MessageCircle,
  Send,
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

import { initials } from "@/lib/format";

type Friend = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
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
  lastMessage: DirectMessage | null;
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
    avatarUrl: string | null;
  };
};

type Group = {
  id: string;
  name: string;

  description?: string | null;

  _count?: {
    members: number;
    messages: number;
  };

  messages?: GroupMessage[];
};

type View =
  | "list"
  | "direct"
  | "group"
  | "create-group";

export default function ChatWidget() {
  const [open, setOpen] =
    useState(false);

  const [view, setView] =
    useState<View>("list");

  const [
    conversations,
    setConversations,
  ] = useState<Conversation[]>([]);

  const [groups, setGroups] =
    useState<Group[]>([]);

  const [
    selectedFriend,
    setSelectedFriend,
  ] =
    useState<Friend | null>(
      null,
    );

  const [
    selectedGroup,
    setSelectedGroup,
  ] =
    useState<Group | null>(
      null,
    );

  const [
    messages,
    setMessages,
  ] =
    useState<DirectMessage[]>([]);

  const [
    groupMessages,
    setGroupMessages,
  ] =
    useState<GroupMessage[]>([]);

  const [
    currentUserId,
    setCurrentUserId,
  ] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [sending, setSending] =
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
    useState<string[]>([]);

  const [
    creatingGroup,
    setCreatingGroup,
  ] =
    useState(false);

  const [
    groupError,
    setGroupError,
  ] =
    useState<string | null>(
      null,
    );

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * =========================
   * LOAD DIRECT CONVERSATIONS
   * =========================
   */

  const loadConversations =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/messages/conversations",
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setConversations(
          data.conversations ??
            [],
        );
      } catch (error) {
        console.error(
          "Load conversations error:",
          error,
        );
      }
    }, []);

  /*
   * =========================
   * LOAD GROUPS
   * =========================
   */

  const loadGroups =
    useCallback(async () => {
      try {
        const response =
          await fetch(
            "/api/messages/groups",
            {
              cache:
                "no-store",
            },
          );

        if (!response.ok) {
          return;
        }

        const data =
          await response.json();

        setGroups(
          data.groups ?? [],
        );
      } catch (error) {
        console.error(
          "Load groups error:",
          error,
        );
      }
    }, []);

  /*
   * =========================
   * DIRECT MESSAGES
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
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          setMessages(
            data.messages ?? [],
          );

          setCurrentUserId(
            data.currentUserId ??
              "",
          );

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

          await loadConversations();
        } catch (error) {
          console.error(
            "Load messages error:",
            error,
          );
        }
      },
      [loadConversations],
    );

  /*
   * =========================
   * GROUP MESSAGES
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
            messagesResponse,
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

            setCurrentUserId(
              detail.currentUserId ??
                "",
            );

            if (
              detail.group
            ) {
              setSelectedGroup(
                detail.group,
              );
            }
          }

          if (
            messagesResponse.ok
          ) {
            const data =
              await messagesResponse.json();

            setGroupMessages(
              data.messages ??
                [],
            );
          }

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
        } catch (error) {
          console.error(
            "Load group messages error:",
            error,
          );
        }
      },
      [],
    );

  /*
   * =========================
   * POLLING
   * =========================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadConversations();
    void loadGroups();

    const interval =
      window.setInterval(
        () => {
          void loadConversations();
          void loadGroups();

          if (
            view ===
              "direct" &&
            selectedFriend
          ) {
            void loadMessages(
              selectedFriend.id,
            );
          }

          if (
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

    return () => {
      window.clearInterval(
        interval,
      );
    };
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
   * DIRECT CHAT
   * =========================
   */

  async function selectConversation(
    friend: Friend,
  ) {
    setSelectedFriend(
      friend,
    );

    setSelectedGroup(null);

    setMessage("");

    setView("direct");

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
      setSending(true);

      const response =
        await fetch(
          `/api/messages/${selectedFriend.id}`,
          {
            method: "POST",

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

      if (!response.ok) {
        return;
      }

      setMessage("");

      await loadMessages(
        selectedFriend.id,
      );
    } finally {
      setSending(false);
    }
  }

  /*
   * =========================
   * GROUP CHAT
   * =========================
   */

  async function selectGroup(
    group: Group,
  ) {
    setSelectedGroup(
      group,
    );

    setSelectedFriend(null);

    setMessage("");

    setView("group");

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
      setSending(true);

      const response =
        await fetch(
          `/api/messages/groups/${selectedGroup.id}/messages`,
          {
            method: "POST",

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

      if (!response.ok) {
        return;
      }

      setMessage("");

      await loadGroupMessages(
        selectedGroup.id,
      );

      await loadGroups();
    } finally {
      setSending(false);
    }
  }

  /*
   * =========================
   * CREATE GROUP
   * =========================
   */

  function toggleMember(
    userId: string,
  ) {
    setSelectedMembers(
      (current) =>
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
      groupName.trim()
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

      setGroupError(null);

      const response =
        await fetch(
          "/api/messages/groups",
          {
            method: "POST",

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

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Unable to create group.",
        );
      }

      setGroupName("");
      setSelectedMembers(
        [],
      );

      await loadGroups();

      const newGroup: Group =
        {
          id:
            data.group.id,

          name:
            data.group.name,

          description:
            data.group
              .description,

          _count: {
            members:
              data.group
                .members
                ?.length ??
              selectedMembers.length +
                1,

            messages: 0,
          },

          messages: [],
        };

      await selectGroup(
        newGroup,
      );
    } catch (error) {
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
   * BACK
   * =========================
   */

  function backToList() {
    setView("list");

    setSelectedFriend(
      null,
    );

    setSelectedGroup(
      null,
    );

    setMessages([]);
    setGroupMessages(
      [],
    );

    setMessage("");
  }

  const unreadTotal =
    conversations.reduce(
      (total, item) =>
        total +
        item.unreadCount,
      0,
    );

  return (
    <>
      {open ? (
        <div
          className="
            fixed
            bottom-24
            right-4
            z-50
            flex
            h-[540px]
            w-[370px]
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
          {/* ===================== */}
          {/* LIST */}
          {/* ===================== */}

          {view ===
            "list" && (
            <>
              <div
                className="
                  flex
                  h-16
                  shrink-0
                  items-center
                  justify-between
                  border-b
                  border-[var(--border)]
                  px-4
                "
              >
                <div>
                  <div className="text-sm font-semibold">
                    Messages
                  </div>

                  <div className="text-xs text-[var(--text-muted)]">
                    Chat with
                    your friends
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {/* CREATE GROUP */}

                  <button
                    type="button"
                    title="Create group"
                    onClick={() => {
                      setView(
                        "create-group",
                      );

                      setGroupError(
                        null,
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
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* GROUPS */}

                {groups.length >
                  0 && (
                  <>
                    <div
                      className="
                        flex
                        items-center
                        justify-between
                        px-4
                        pb-1
                        pt-4
                      "
                    >
                      <span
                        className="
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.14em]
                          text-[var(--text-muted)]
                        "
                      >
                        Groups
                      </span>

                      <span className="text-[10px] text-[var(--text-muted)]">
                        {
                          groups.length
                        }
                      </span>
                    </div>

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
                          </button>
                        );
                      },
                    )}

                    <div className="mx-4 border-b border-[var(--border)]" />
                  </>
                )}

                {/* DIRECT */}

                <div
                  className="
                    px-4
                    pb-1
                    pt-4
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-[var(--text-muted)]
                  "
                >
                  Friends
                </div>

                {conversations.length ===
                0 ? (
                  <div
                    className="
                      flex
                      min-h-40
                      items-center
                      justify-center
                      px-6
                      text-center
                      text-sm
                      text-[var(--text-muted)]
                    "
                  >
                    Add friends
                    first to start
                    chatting.
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
                        0 ? (
                          <span
                            className="
                              grid
                              h-5
                              min-w-5
                              place-items-center
                              rounded-full
                              bg-[var(--primary)]
                              px-1.5
                              text-[10px]
                              font-semibold
                              text-white
                            "
                          >
                            {
                              conversation.unreadCount
                            }
                          </span>
                        ) : null}
                      </button>
                    ),
                  )
                )}
              </div>
            </>
          )}

          {/* ===================== */}
          {/* CREATE GROUP */}
          {/* ===================== */}

          {view ===
            "create-group" && (
            <>
              <div
                className="
                  flex
                  h-16
                  shrink-0
                  items-center
                  gap-2
                  border-b
                  border-[var(--border)]
                  px-3
                "
              >
                <button
                  type="button"
                  onClick={
                    backToList
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
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    New group
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)]">
                    Add friends
                    to a room
                  </div>
                </div>

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

              <div className="flex-1 overflow-y-auto p-4">
                <div>
                  <label
                    className="
                      mb-1.5
                      block
                      text-xs
                      font-medium
                    "
                  >
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
                        event
                          .target
                          .value,
                      )
                    }
                    placeholder="Backend Team"
                    className="
                      field
                      h-10
                      w-full
                      px-3
                      text-sm
                    "
                  />
                </div>

                <div
                  className="
                    mt-5
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <div className="text-xs font-medium">
                      Add
                      members
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
                  <div
                    className="
                      mt-3
                      rounded-lg
                      border
                      border-red-200
                      bg-red-50
                      px-3
                      py-2
                      text-xs
                      text-red-600
                    "
                  >
                    {
                      groupError
                    }
                  </div>
                )}

                <div className="mt-3 space-y-1">
                  {conversations.length ===
                  0 ? (
                    <div className="py-10 text-center text-sm text-[var(--text-muted)]">
                      You need
                      friends before
                      creating a
                      group.
                    </div>
                  ) : (
                    conversations.map(
                      (
                        conversation,
                      ) => {
                        const friend =
                          conversation.friend;

                        const selected =
                          selectedMembers.includes(
                            friend.id,
                          );

                        return (
                          <button
                            key={
                              friend.id
                            }
                            type="button"
                            onClick={() =>
                              toggleMember(
                                friend.id,
                              )
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

                              <div className="text-[10px] text-[var(--text-muted)]">
                                {
                                  friend.role
                                }
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
                                  selected
                                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                    : "border-[var(--border-strong)]"
                                }
                              `}
                            >
                              {selected && (
                                <Check className="h-3 w-3" />
                              )}
                            </div>
                          </button>
                        );
                      },
                    )
                  )}
                </div>
              </div>

              <div
                className="
                  shrink-0
                  border-t
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-3
                "
              >
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
                    transition
                    disabled:cursor-not-allowed
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
              </div>
            </>
          )}

          {/* ===================== */}
          {/* DIRECT CHAT */}
          {/* ===================== */}

          {view ===
            "direct" &&
            selectedFriend && (
              <>
                <ChatHeader
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

                <div
                  className="
                    flex-1
                    space-y-2
                    overflow-y-auto
                    bg-[var(--surface-soft)]
                    p-4
                  "
                >
                  {messages.length ===
                  0 ? (
                    <EmptyChat
                      text={`Start your conversation with ${selectedFriend.name}.`}
                    />
                  ) : (
                    messages.map(
                      (
                        item,
                      ) => {
                        const mine =
                          item.senderId ===
                          currentUserId;

                        return (
                          <MessageBubble
                            key={
                              item.id
                            }
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
                        );
                      },
                    )
                  )}

                  <div
                    ref={
                      bottomRef
                    }
                  />
                </div>

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

          {/* ===================== */}
          {/* GROUP CHAT */}
          {/* ===================== */}

          {view ===
            "group" &&
            selectedGroup && (
              <>
                <ChatHeader
                  title={
                    selectedGroup.name
                  }
                  subtitle={`${
                    selectedGroup
                      ._count
                      ?.members ??
                    0
                  } members`}
                  avatar={
                    <GroupAvatar
                      name={
                        selectedGroup.name
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

                <div
                  className="
                    flex-1
                    space-y-3
                    overflow-y-auto
                    bg-[var(--surface-soft)]
                    p-4
                  "
                >
                  {groupMessages.length ===
                  0 ? (
                    <EmptyChat
                      text={`Start a conversation in ${selectedGroup.name}.`}
                    />
                  ) : (
                    groupMessages.map(
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
                              <div
                                className="
                                  mb-1
                                  ml-1
                                  text-[10px]
                                  font-medium
                                  text-[var(--text-muted)]
                                "
                              >
                                {
                                  item
                                    .sender
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
                    )
                  )}

                  <div
                    ref={
                      bottomRef
                    }
                  />
                </div>

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
        </div>
      ) : null}

      {/* FLOATING */}

      <button
        type="button"
        onClick={() =>
          setOpen(
            (value) =>
              !value,
          )
        }
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
        aria-label="Open messages"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}

        {!open &&
        unreadTotal > 0 ? (
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
              px-1
              text-[10px]
              font-bold
              text-white
            "
          >
            {unreadTotal >
            99
              ? "99+"
              : unreadTotal}
          </span>
        ) : null}
      </button>
    </>
  );
}

/*
 * =========================
 * CHAT HEADER
 * =========================
 */

function ChatHeader({
  title,
  subtitle,
  avatar,
  onBack,
  onClose,
}: {
  title: string;
  subtitle: string;
  avatar: React.ReactNode;
  onBack: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="
        flex
        h-16
        shrink-0
        items-center
        gap-2
        border-b
        border-[var(--border)]
        px-3
      "
    >
      <button
        type="button"
        onClick={onBack}
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
  );
}

/*
 * =========================
 * COMPOSER
 * =========================
 */

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
  onSend: () => void;
}) {
  return (
    <div
      className="
        shrink-0
        border-t
        border-[var(--border)]
        bg-[var(--surface)]
        p-3
      "
    >
      <div className="flex items-end gap-2">
        <textarea
          value={value}
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
          rows={1}
          placeholder="Write a message..."
          className="
            field
            max-h-28
            min-h-10
            flex-1
            resize-none
            px-3
            py-2
            text-sm
          "
        />

        <button
          type="button"
          disabled={
            sending ||
            !value.trim()
          }
          onClick={onSend}
          className="
            grid
            h-10
            w-10
            shrink-0
            place-items-center
            rounded-xl
            bg-[var(--primary)]
            text-white
            transition
            disabled:opacity-40
          "
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

/*
 * =========================
 * MESSAGE
 * =========================
 */

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

function EmptyChat({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        flex
        h-full
        min-h-72
        items-center
        justify-center
        text-center
        text-sm
        text-[var(--text-muted)]
      "
    >
      {text}
    </div>
  );
}

/*
 * =========================
 * AVATAR
 * =========================
 */

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

  if (user.avatarUrl) {
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
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  const size =
    small
      ? "h-9 w-9"
      : "h-10 w-10";

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
          small
            ? "h-4 w-4"
            : "h-[18px] w-[18px]"
        }
      />
    </div>
  );
}