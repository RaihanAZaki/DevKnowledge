"use client";

import {
  ArrowLeft,
  MessageCircle,
  Send,
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

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [selectedFriend, setSelectedFriend] =
    useState<Friend | null>(null);

  const [messages, setMessages] =
    useState<DirectMessage[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [message, setMessage] = useState("");

  const [sending, setSending] =
    useState(false);

  const bottomRef =
    useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/messages/conversations"
      );

      if (!response.ok) return;

      const data = await response.json();

      setConversations(
        data.conversations ?? []
      );
    } catch (error) {
      console.error(
        "Load conversations error:",
        error
      );
    }
  }, []);

  const loadMessages = useCallback(
    async (friendId: string) => {
      try {
        const response = await fetch(
          `/api/messages/${friendId}`
        );

        if (!response.ok) return;

        const data = await response.json();

        setMessages(data.messages ?? []);
        setCurrentUserId(
          data.currentUserId ?? ""
        );

        setTimeout(() => {
          bottomRef.current?.scrollIntoView({
            behavior: "smooth",
          });
        }, 50);

        await loadConversations();
      } catch (error) {
        console.error(
          "Load messages error:",
          error
        );
      }
    },
    [loadConversations]
  );

  useEffect(() => {
    if (!open) return;

    loadConversations();

    const interval = window.setInterval(() => {
      loadConversations();

      if (selectedFriend) {
        loadMessages(selectedFriend.id);
      }
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    open,
    selectedFriend,
    loadConversations,
    loadMessages,
  ]);

  async function selectConversation(
    friend: Friend
  ) {
    setSelectedFriend(friend);

    await loadMessages(friend.id);
  }

  async function sendMessage() {
    if (
      !selectedFriend ||
      !message.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch(
        `/api/messages/${selectedFriend.id}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            content: message.trim(),
          }),
        }
      );

      if (!response.ok) {
        const data =
          await response.json();

        console.error(
          "Send message error:",
          data
        );

        return;
      }

      setMessage("");

      await loadMessages(
        selectedFriend.id
      );
    } finally {
      setSending(false);
    }
  }

  const unreadTotal =
    conversations.reduce(
      (total, item) =>
        total + item.unreadCount,
      0
    );

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-4 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:right-6">
          {!selectedFriend ? (
            <>
              <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
                <div>
                  <div className="text-sm font-semibold">
                    Messages
                  </div>

                  <div className="text-xs text-[var(--text-muted)]">
                    Chat with your friends
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {conversations.length ===
                0 ? (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--text-muted)]">
                    Add friends first to
                    start chatting.
                  </div>
                ) : (
                  conversations.map(
                    (conversation) => (
                      <button
                        key={
                          conversation.friend
                            .id
                        }
                        type="button"
                        onClick={() =>
                          selectConversation(
                            conversation.friend
                          )
                        }
                        className="flex w-full items-center gap-3 border-b border-[var(--border)] px-4 py-3 text-left transition hover:bg-[var(--surface-hover)]"
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
                                .friend.name
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
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--primary)] px-1.5 text-[10px] font-semibold text-white">
                            {
                              conversation.unreadCount
                            }
                          </span>
                        ) : null}
                      </button>
                    )
                  )
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex h-16 items-center gap-2 border-b border-[var(--border)] px-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedFriend(null)
                  }
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>

                <Avatar
                  user={selectedFriend}
                  small
                />

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">
                    {selectedFriend.name}
                  </div>

                  <div className="text-[11px] text-[var(--text-muted)]">
                    {selectedFriend.role}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOpen(false)
                  }
                  className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-[var(--surface-soft)] p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-[var(--text-muted)]">
                    Start your conversation
                    with{" "}
                    {selectedFriend.name}.
                  </div>
                ) : (
                  messages.map((item) => {
                    const mine =
                      item.senderId ===
                      currentUserId;

                    return (
                      <div
                        key={item.id}
                        className={`flex ${
                          mine
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                            mine
                              ? "rounded-br-md bg-[var(--primary)] text-white"
                              : "rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
                          }`}
                        >
                          {item.content}

                          <div
                            className={`mt-1 text-[9px] ${
                              mine
                                ? "text-white/70"
                                : "text-[var(--text-muted)]"
                            }`}
                          >
                            {new Date(
                              item.createdAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute:
                                  "2-digit",
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                <div ref={bottomRef} />
              </div>

              <div className="border-t border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={message}
                    onChange={(event) =>
                      setMessage(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" &&
                        !event.shiftKey
                      ) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message..."
                    className="field max-h-28 min-h-10 flex-1 resize-none px-3 py-2 text-sm"
                  />

                  <button
                    type="button"
                    disabled={
                      sending ||
                      !message.trim()
                    }
                    onClick={
                      sendMessage
                    }
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary)] text-white transition disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="fixed bottom-6 right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-[var(--primary)] text-white shadow-xl transition hover:scale-105 sm:right-6"
        aria-label="Open messages"
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}

        {!open && unreadTotal > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadTotal > 99
              ? "99+"
              : unreadTotal}
          </span>
        ) : null}
      </button>
    </>
  );
}

function Avatar({
  user,
  small = false,
}: {
  user: Friend;
  small?: boolean;
}) {
  const size = small
    ? "h-9 w-9"
    : "h-10 w-10";

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`grid ${size} shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]`}
    >
      {initials(user.name)}
    </div>
  );
}