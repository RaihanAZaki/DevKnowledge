"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Clock3,
  LoaderCircle,
  MessageSquare,
  ShieldCheck,
  Trophy,
  UserCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  referenceId: string | null;
  createdAt: string;
};

type NotificationResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

function relativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  }).format(date);
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "FRIEND_REQUEST") {
    return <UserPlus className="h-4 w-4" />;
  }

  if (type === "FRIEND_ACCEPTED") {
    return <UserCheck className="h-4 w-4" />;
  }

  if (type === "FORUM_REPLY") {
    return <MessageSquare className="h-4 w-4" />;
  }

  if (type === "FORUM_ACCEPTED") {
    return <Check className="h-4 w-4" />;
  }

  if (type === "BADGE") {
    return <Trophy className="h-4 w-4" />;
  }

  if (
    type === "GROUP_ADMIN" ||
    type === "GROUP_ROLE" ||
    type === "GROUP_OWNER"
  ) {
    return <ShieldCheck className="h-4 w-4" />;
  }

  if (
    type === "GROUP_MESSAGE" ||
    type === "GROUP_MEMBER" ||
    type === "GROUP_MENTION" ||
    type === "GROUP_ADDED"
  ) {
    return <UsersRound className="h-4 w-4" />;
  }

  return <Bell className="h-4 w-4" />;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await fetch(
          "/api/notifications?limit=30",
          {
            cache: "no-store",
          },
        );

        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load notifications.",
          );
        }

        const data =
          (await response.json()) as NotificationResponse;

        setItems(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
        setError(null);
      } catch (loadError) {
        console.error(
          "LOAD NOTIFICATIONS:",
          loadError,
        );

        if (!silent) {
          setError(
            "Unable to load notifications.",
          );
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications(true);
    }, 10000);

    return () =>
      window.clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (
        open &&
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      onMouseDown,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onMouseDown,
      );
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow =
      document.body.style.overflow;

    if (window.innerWidth < 640) {
      document.body.style.overflow =
        "hidden";
    }

    return () => {
      document.body.style.overflow =
        originalOverflow;
    };
  }, [open]);

  async function markRead(id: string) {
    const current = items.find(
      (item) => item.id === id,
    );

    if (!current || current.isRead) {
      return;
    }

    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              isRead: true,
            }
          : item,
      ),
    );

    setUnreadCount((count) =>
      Math.max(0, count - 1),
    );

    const response = await fetch(
      `/api/notifications/${id}/read`,
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      await loadNotifications(true);
    }
  }

  async function markAllRead() {
    if (unreadCount === 0) {
      return;
    }

    const response = await fetch(
      "/api/notifications/read-all",
      {
        method: "POST",
      },
    );

    if (!response.ok) {
      return;
    }

    setItems((previous) =>
      previous.map((item) => ({
        ...item,
        isRead: true,
      })),
    );

    setUnreadCount(0);
  }

  async function respondToFriendRequest(
    notification: NotificationItem,
    decision: "accept" | "reject",
  ) {
    if (!notification.referenceId) {
      return;
    }

    try {
      setActionId(notification.id);
      setError(null);

      const response = await fetch(
        `/api/friends/${notification.referenceId}/${decision}`,
        {
          method: "POST",
        },
      );

      const contentType =
        response.headers.get(
          "content-type",
        ) ?? "";

      const data =
        contentType.includes(
          "application/json",
        )
          ? await response.json()
          : null;

      if (!response.ok) {
        throw new Error(
          data?.error ??
            `Unable to ${decision} friend request.`,
        );
      }

      await loadNotifications(true);

      window.dispatchEvent(
        new CustomEvent(
          "devknowledge:friendship-changed",
          {
            detail: {
              decision,
              friendshipId:
                notification.referenceId,
            },
          },
        ),
      );
    } catch (actionError) {
      console.error(
        "FRIEND REQUEST NOTIFICATION ACTION:",
        actionError,
      );

      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update friend request.",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() =>
          setOpen((value) => !value)
        }
        className="
          relative
          grid
          h-10
          w-10
          place-items-center
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          transition
          hover:bg-[var(--surface-soft)]
        "
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />

        {unreadCount > 0 ? (
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
              font-semibold
              text-white
              ring-2
              ring-[var(--background)]
            "
          >
            {unreadCount > 99
              ? "99+"
              : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          {/* MOBILE BACKDROP */}
          <button
            type="button"
            className="
              fixed
              inset-0
              z-[80]
              bg-black/15
              backdrop-blur-[1px]
              sm:hidden
            "
            onClick={() =>
              setOpen(false)
            }
            aria-label="Close notifications"
          />

          {/* PANEL */}
          <div
            className="
              fixed
              left-3
              right-3
              top-[calc(env(safe-area-inset-top)+72px)]
              z-[90]
              flex
              max-h-[72dvh]
              flex-col
              overflow-hidden
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              shadow-2xl

              sm:absolute
              sm:left-auto
              sm:right-0
              sm:top-12
              sm:z-50
              sm:w-[360px]
              sm:max-h-none
            "
          >
            {/* HEADER */}
            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                border-b
                border-[var(--border)]
                px-4
                py-3.5
              "
            >
              <div>
                <div className="text-sm font-semibold">
                  Notifications
                </div>

                <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="
                  grid
                  h-8
                  w-8
                  place-items-center
                  rounded-lg
                  text-[var(--text-muted)]
                  transition
                  hover:bg-[var(--surface-hover)]
                  hover:text-[var(--text)]
                "
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* ERROR */}
            {error ? (
              <div
                className="
                  shrink-0
                  border-b
                  border-red-200
                  bg-red-50
                  px-4
                  py-2.5
                  text-xs
                  text-red-600
                "
              >
                {error}
              </div>
            ) : null}

            {/* LIST */}
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain

                sm:max-h-[430px]
              "
            >
              {loading &&
              items.length === 0 ? (
                <div className="flex min-h-40 items-center justify-center text-[var(--text-muted)]">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : items.length === 0 ? (
                <div
                  className="
                    flex
                    min-h-48
                    flex-col
                    items-center
                    justify-center
                    px-6
                    text-center
                  "
                >
                  <div
                    className="
                      grid
                      h-11
                      w-11
                      place-items-center
                      rounded-2xl
                      bg-[var(--primary-soft)]
                      text-[var(--primary)]
                    "
                  >
                    <Bell className="h-5 w-5" />
                  </div>

                  <div className="mt-3 text-sm font-medium">
                    No notifications yet
                  </div>

                  <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                    Friend requests and other
                    activity will appear here.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {items.map((item) => {
                    const isFriendRequest =
                      item.type ===
                      "FRIEND_REQUEST";

                    const actionLoading =
                      actionId === item.id;

                    const content = (
                      <>
                        <div
                          className={`
                            grid
                            h-9
                            w-9
                            shrink-0
                            place-items-center
                            rounded-xl

                            ${
                              item.isRead
                                ? `
                                  bg-[var(--surface-soft)]
                                  text-[var(--text-muted)]
                                `
                                : `
                                  bg-[var(--primary-soft)]
                                  text-[var(--primary)]
                                `
                            }
                          `}
                        >
                          <NotificationIcon
                            type={item.type}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p
                                className="
                                  break-words
                                  text-sm
                                  font-medium
                                "
                              >
                                {item.title}
                              </p>

                              <p
                                className="
                                  mt-1
                                  break-words
                                  text-xs
                                  leading-5
                                  text-[var(--text-soft)]
                                "
                              >
                                {item.message}
                              </p>
                            </div>

                            {!item.isRead ? (
                              <span
                                className="
                                  mt-1.5
                                  h-2
                                  w-2
                                  shrink-0
                                  rounded-full
                                  bg-[var(--primary)]
                                "
                              />
                            ) : null}
                          </div>

                          <div
                            className="
                              mt-2
                              flex
                              items-center
                              gap-1.5
                              text-[10px]
                              text-[var(--text-muted)]
                            "
                          >
                            <Clock3 className="h-3 w-3" />

                            {relativeTime(
                              item.createdAt,
                            )}
                          </div>

                          {isFriendRequest ? (
                            <div
                              className="
                                mt-3
                                grid
                                grid-cols-2
                                gap-2
                              "
                            >
                              <button
                                type="button"
                                disabled={
                                  actionLoading
                                }
                                onClick={(
                                  event,
                                ) => {
                                  event.stopPropagation();

                                  void respondToFriendRequest(
                                    item,
                                    "accept",
                                  );
                                }}
                                className="
                                  inline-flex
                                  h-8
                                  min-w-0
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  bg-[var(--primary)]
                                  px-2
                                  text-xs
                                  font-medium
                                  text-white
                                  transition
                                  hover:opacity-90
                                  disabled:opacity-50
                                "
                              >
                                {actionLoading ? (
                                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}

                                <span className="truncate">
                                  Accept
                                </span>
                              </button>

                              <button
                                type="button"
                                disabled={
                                  actionLoading
                                }
                                onClick={(
                                  event,
                                ) => {
                                  event.stopPropagation();

                                  void respondToFriendRequest(
                                    item,
                                    "reject",
                                  );
                                }}
                                className="
                                  inline-flex
                                  h-8
                                  min-w-0
                                  items-center
                                  justify-center
                                  gap-1.5
                                  rounded-lg
                                  border
                                  border-[var(--border)]
                                  bg-[var(--surface)]
                                  px-2
                                  text-xs
                                  font-medium
                                  transition
                                  hover:bg-[var(--surface-soft)]
                                  disabled:opacity-50
                                "
                              >
                                <X className="h-3.5 w-3.5" />

                                <span className="truncate">
                                  Decline
                                </span>
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </>
                    );

                    const itemClassName = `
                      flex
                      min-w-0
                      gap-3
                      p-4
                      transition
                      hover:bg-[var(--surface-soft)]

                      ${
                        item.isRead
                          ? ""
                          : `
                            bg-[color-mix(in_srgb,var(--primary-soft)_35%,transparent)]
                          `
                      }
                    `;

                    if (
                      item.type ===
                        "FRIEND_ACCEPTED" &&
                      item.referenceId
                    ) {
                      return (
                        <Link
                          key={item.id}
                          href={`/profile/${item.referenceId}`}
                          onClick={() => {
                            void markRead(
                              item.id,
                            );

                            setOpen(false);
                          }}
                          className={
                            itemClassName
                          }
                        >
                          {content}
                        </Link>
                      );
                    }

                    if (
                      [
                        "GROUP_MENTION",
                        "GROUP_ADDED",
                        "GROUP_ROLE",
                        "GROUP_OWNER",
                        "GROUP_MESSAGE",
                        "GROUP_MEMBER",
                        "GROUP_ADMIN",
                      ].includes(
                        item.type,
                      ) &&
                      item.referenceId
                    ) {
                      return (
                        <Link
                          key={item.id}
                          href={`/messages/groups/${item.referenceId}`}
                          onClick={() => {
                            void markRead(
                              item.id,
                            );

                            setOpen(false);
                          }}
                          className={
                            itemClassName
                          }
                        >
                          {content}
                        </Link>
                      );
                    }

                    return (
                      <div
                        key={item.id}
                        onClick={() =>
                          void markRead(
                            item.id,
                          )
                        }
                        className={`
                          ${itemClassName}
                          cursor-pointer
                        `}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-3
                border-t
                border-[var(--border)]
                bg-[var(--surface-soft)]
                px-4
                py-3
              "
            >
              <span
                className="
                  hidden
                  text-[11px]
                  text-[var(--text-muted)]

                  sm:block
                "
              >
                Updates refresh automatically
              </span>

              <button
                type="button"
                disabled={
                  unreadCount === 0
                }
                onClick={() =>
                  void markAllRead()
                }
                className="
                  ml-auto
                  inline-flex
                  items-center
                  gap-1.5
                  text-xs
                  font-medium
                  text-[var(--primary)]
                  disabled:cursor-default
                  disabled:opacity-40
                "
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}