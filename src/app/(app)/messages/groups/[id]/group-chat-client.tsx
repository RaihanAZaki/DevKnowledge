"use client";

import Link from "next/link";

import {
  ArrowLeft,
  LoaderCircle,
  LogOut,
  Send,
  Trash2,
  Users,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Member = {
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
  };
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;

  sender: {
    id: string;
    name: string;
    avatarUrl:
      | string
      | null;
  };
};

type GroupData = {
  group: {
    id: string;
    name: string;
    description:
      | string
      | null;

    ownerId: string;
    createdAt: string;
    updatedAt: string;

    members: Member[];

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

function time(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function GroupChatClient({
  initialData,
  initialMessages,
}: {
  initialData: GroupData;
  initialMessages: Message[];
}) {
  const router =
    useRouter();

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  const [
    messages,
    setMessages,
  ] =
    useState<Message[]>(
      initialMessages,
    );

  const [content, setContent] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  const [
    confirmDelete,
    setConfirmDelete,
  ] =
    useState(false);

  async function loadMessages() {
    const response =
      await fetch(
        `/api/messages/groups/${initialData.group.id}/messages`,
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

    setMessages(
      data.messages,
    );
  }

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          void loadMessages();
        },
        3000,
      );

    return () =>
      window.clearInterval(
        interval,
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView(
      {
        behavior:
          "smooth",
      },
    );
  }, [messages]);

  async function send() {
    if (
      !content.trim() ||
      sending
    ) {
      return;
    }

    try {
      setSending(true);

      const response =
        await fetch(
          `/api/messages/groups/${initialData.group.id}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                content,
              }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        return;
      }

      setContent("");

      setMessages(
        (current) => [
          ...current,
          data.message,
        ],
      );
    } finally {
      setSending(false);
    }
  }

  async function leave() {
    const response =
      await fetch(
        `/api/messages/groups/${initialData.group.id}/leave`,
        {
          method: "POST",
        },
      );

    if (!response.ok) {
      return;
    }

    router.push(
      "/messages/groups",
    );

    router.refresh();
  }

  async function removeGroup() {
    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/messages/groups/${initialData.group.id}`,
          {
            method:
              "DELETE",
          },
        );

      if (!response.ok) {
        return;
      }

      router.push(
        "/messages/groups",
      );

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      {/* CHAT */}

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[var(--border)] px-[var(--space-card)]">
          <Link
            href="/messages/groups"
            className="grid h-9 w-9 place-items-center rounded-lg transition hover:bg-[var(--surface-soft)]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold">
              {
                initialData
                  .group.name
              }
            </h1>

            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {
                initialData
                  .group
                  ._count
                  .members
              }{" "}
              members
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-[var(--space-card)] py-[var(--space-card)]">
          <div className="mx-auto max-w-3xl space-y-[var(--space-section-small)]">
            {messages.map(
              (message) => {
                const own =
                  message
                    .sender
                    .id ===
                  initialData.currentUserId;

                return (
                  <div
                    key={
                      message.id
                    }
                    className={`flex ${
                      own
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] ${
                        own
                          ? "text-right"
                          : ""
                      }`}
                    >
                      {!own && (
                        <p className="mb-1 text-[11px] font-medium text-[var(--text-muted)]">
                          {
                            message
                              .sender
                              .name
                          }
                        </p>
                      )}

                      <div
                        className={`
                          inline-block
                          rounded-2xl
                          px-[var(--space-inline)]
                          py-2.5
                          text-left
                          text-sm
                          leading-6

                          ${
                            own
                              ? "rounded-br-md bg-[var(--text)] text-[var(--background)]"
                              : "rounded-bl-md bg-[var(--surface-soft)] text-[var(--text)]"
                          }
                        `}
                      >
                        {
                          message.content
                        }
                      </div>

                      <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                        {time(
                          message.createdAt,
                        )}
                      </p>
                    </div>
                  </div>
                );
              },
            )}

            <div
              ref={
                bottomRef
              }
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-[var(--space-card-sm)]">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              value={content}
              onChange={(
                event,
              ) =>
                setContent(
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

                  void send();
                }
              }}
              rows={1}
              placeholder="Type a message..."
              className="field min-h-[var(--control-height-lg)] max-h-32 flex-1 resize-none px-3 py-2.5 text-sm"
            />

            <button
              type="button"
              disabled={
                sending ||
                !content.trim()
              }
              onClick={
                send
              }
              className="grid h-[var(--control-height-lg)] w-11 shrink-0 place-items-center rounded-xl bg-[var(--text)] text-[var(--background)] disabled:opacity-40"
            >
              {sending ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* MEMBERS */}

      <aside className="hidden w-72 shrink-0 border-l border-[var(--border)] lg:block">
        <div className="border-b border-[var(--border)] p-[var(--space-card)]">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />

            <h2 className="text-sm font-semibold">
              Members
            </h2>
          </div>

          {initialData.group
            .description && (
            <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">
              {
                initialData
                  .group
                  .description
              }
            </p>
          )}
        </div>

        <div className="max-h-[calc(100%-150px)] overflow-y-auto p-3">
          {initialData.group.members.map(
            (member) => (
              <div
                key={
                  member.id
                }
                className="flex items-center gap-3 rounded-xl px-2 py-2"
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--surface-soft)] text-[11px] font-semibold">
                  {member.user.name
                    .split(" ")
                    .map(
                      (
                        part,
                      ) =>
                        part[0],
                    )
                    .join("")
                    .slice(
                      0,
                      2,
                    )
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {
                      member
                        .user
                        .name
                    }
                  </p>

                  <p className="text-[10px] text-[var(--text-muted)]">
                    {
                      member.role
                    }
                  </p>
                </div>
              </div>
            ),
          )}
        </div>

        <div className="absolute bottom-0 w-72 border-t border-[var(--border)] bg-[var(--surface)] p-3">
          {initialData.isOwner ? (
            <button
              type="button"
              onClick={() =>
                setConfirmDelete(
                  true,
                )
              }
              className="flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />

              Delete group
            </button>
          ) : (
            <button
              type="button"
              onClick={
                leave
              }
              className="flex h-[var(--control-height)] w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-red-500 transition hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />

              Leave group
            </button>
          )}
        </div>
      </aside>

      {/* DELETE MODAL */}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-[var(--space-inline)] backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="p-6">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-500">
                <Trash2 className="h-5 w-5" />
              </div>

              <h2 className="mt-[var(--space-section-small)] text-lg font-semibold">
                Delete group?
              </h2>

              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                This will permanently
                delete{" "}
                <strong className="text-[var(--text)]">
                  {
                    initialData
                      .group
                      .name
                  }
                </strong>{" "}
                and all messages.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[var(--surface-soft)] px-[var(--space-section)] py-[var(--space-row-y)]">
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setConfirmDelete(
                    false,
                  )
                }
                className="h-9 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-[var(--space-inline)] text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  removeGroup
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-500 px-[var(--space-inline)] text-sm font-medium text-white disabled:opacity-50"
              >
                {deleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete group"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}