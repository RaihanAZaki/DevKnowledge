"use client";

import Link from "next/link";
import {
  Check,
  Clock3,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { Spinner } from "@/components/ui";
import { initials } from "@/lib/format";

type User = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
};

type Friend = {
  friendshipId: string;
  user: User;
};

type Incoming = {
  id: string;
  requester: User;
};

type Outgoing = {
  id: string;
  addressee: User;
};

export default function FriendsClient({
  initialData,
}: {
  initialData: {
    friends: Friend[];
    incoming: Incoming[];
    outgoing: Outgoing[];
  };
}) {
  const [friends, setFriends] =
    useState<Friend[]>(initialData.friends);

  const [incoming, setIncoming] =
    useState<Incoming[]>(initialData.incoming);

  const [outgoing, setOutgoing] =
    useState<Outgoing[]>(initialData.outgoing);

  const [results, setResults] =
    useState<User[]>([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const loadFriends =
    useCallback(async () => {
      try {
        const response =
          await fetch("/api/friends");

        if (response.status === 401) {
          window.location.href =
            "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load friends.",
          );
        }

        const data =
          await response.json();

        setFriends(
          data.friends ?? [],
        );

        setIncoming(
          data.incoming ?? [],
        );

        setOutgoing(
          data.outgoing ?? [],
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    function handleFriendshipChanged() {
      void loadFriends();
    }

    window.addEventListener(
      "devknowledge:friendship-changed",
      handleFriendshipChanged,
    );

    return () => {
      window.removeEventListener(
        "devknowledge:friendship-changed",
        handleFriendshipChanged,
      );
    };
  }, [loadFriends]);

  useEffect(() => {
    if (
      query.trim().length < 2
    ) {
      setResults([]);
      return;
    }

    const timer =
      window.setTimeout(
        async () => {
          const response =
            await fetch(
              `/api/users/search?q=${encodeURIComponent(
                query.trim(),
              )}`,
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          setResults(
            data.users ?? [],
          );
        },
        300,
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  async function addFriend(
    userId: string,
  ) {
    await fetch(
      "/api/friends/request",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          userId,
        }),
      },
    );

    setResults((current) =>
      current.filter(
        (item) =>
          item.id !== userId,
      ),
    );

    await loadFriends();
  }

  async function accept(
    friendshipId: string,
  ) {
    await fetch(
      `/api/friends/${friendshipId}/accept`,
      {
        method: "POST",
      },
    );

    await loadFriends();
  }

  async function reject(
    friendshipId: string,
  ) {
    await fetch(
      `/api/friends/${friendshipId}/reject`,
      {
        method: "POST",
      },
    );

    await loadFriends();
  }

  if (loading) {
    return (
      <Spinner label="Loading friends" />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-7 sm:space-y-8">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[var(--text-muted)] sm:text-xs">
          <Users className="h-4 w-4" />
          Community
        </div>

        <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">
          Friends
        </h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
          Connect with developers and discover what your teammates are sharing.
        </p>
      </div>

      {/* SEARCH */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Find developers
        </h2>

        <div className="relative">
          <Search
            className="
              pointer-events-none
              absolute
              left-3
              top-1/2
              h-4
              w-4
              -translate-y-1/2
              text-[var(--text-muted)]
            "
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value,
              )
            }
            placeholder="Search by name or email..."
            className="
              field
              h-[var(--control-height-lg)]
              w-full
              pl-9
              pr-3
              text-sm
            "
          />
        </div>

        {/* SEARCH RESULTS */}
        {results.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {results.map(
              (user) => (
                <div
                  key={user.id}
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                    border-b
                    border-[var(--border)]
                    px-3
                    py-[var(--space-row-y)]
                    last:border-b-0

                    sm:px-[var(--space-inline)]
                  "
                >
                  <Avatar user={user} />

                  <Link
                    href={`/profile/${user.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="truncate text-sm font-medium">
                      {user.name}
                    </div>

                    <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      {user.role}
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      addFriend(
                        user.id,
                      )
                    }
                    className="
                      inline-flex
                      h-8
                      shrink-0
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-2.5
                      text-xs
                      font-medium
                      transition
                      hover:bg-[var(--surface-soft)]

                      sm:px-3
                    "
                  >
                    <UserPlus className="h-3.5 w-3.5" />

                    <span className="hidden xs:inline">
                      Add
                    </span>
                  </button>
                </div>
              ),
            )}
          </div>
        ) : null}
      </section>

      {/* INCOMING REQUESTS */}
      {incoming.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Friend requests
          </h2>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {incoming.map(
              (item) => (
                <div
                  key={item.id}
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                    border-b
                    border-[var(--border)]
                    px-3
                    py-[var(--space-row-y)]
                    last:border-b-0

                    sm:px-[var(--space-inline)]
                  "
                >
                  <Avatar
                    user={
                      item.requester
                    }
                  />

                  <Link
                    href={`/profile/${item.requester.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="truncate text-sm font-medium">
                      {
                        item
                          .requester
                          .name
                      }
                    </div>

                    <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      {
                        item
                          .requester
                          .role
                      }
                    </div>
                  </Link>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        accept(
                          item.id,
                        )
                      }
                      className="
                        grid
                        h-8
                        w-8
                        place-items-center
                        rounded-lg
                        bg-[var(--text)]
                        text-[var(--background)]
                        transition
                        hover:opacity-90
                      "
                      aria-label="Accept friend request"
                    >
                      <Check className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        reject(
                          item.id,
                        )
                      }
                      className="
                        grid
                        h-8
                        w-8
                        place-items-center
                        rounded-lg
                        border
                        border-[var(--border)]
                        transition
                        hover:bg-[var(--surface-soft)]
                      "
                      aria-label="Decline friend request"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
      ) : null}

      {/* OUTGOING */}
      {outgoing.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Sent requests
          </h2>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            {outgoing.map(
              (item) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.addressee.id}`}
                  className="
                    flex
                    min-w-0
                    items-center
                    gap-3
                    border-b
                    border-[var(--border)]
                    px-3
                    py-[var(--space-row-y)]
                    transition
                    last:border-b-0
                    hover:bg-[var(--surface-soft)]

                    sm:px-[var(--space-inline)]
                  "
                >
                  <Avatar
                    user={
                      item.addressee
                    }
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {
                        item
                          .addressee
                          .name
                      }
                    </div>

                    <div className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                      Waiting for approval
                    </div>
                  </div>

                  <Clock3 className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                </Link>
              ),
            )}
          </div>
        </section>
      ) : null}

      {/* FRIENDS */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Your friends
          </h2>

          <span className="text-xs text-[var(--text-muted)]">
            {friends.length}
          </span>
        </div>

        {friends.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] px-[var(--space-section)] py-10 text-center text-sm text-[var(--text-muted)]">
            No friends yet.
          </div>
        ) : (
          <div
            className="
              grid
              gap-3

              sm:grid-cols-2
            "
          >
            {friends.map(
              (friend) => (
                <Link
                  key={
                    friend.friendshipId
                  }
                  href={`/profile/${friend.user.id}`}
                  className="
                    group
                    flex
                    min-w-0
                    items-center
                    gap-3
                    rounded-2xl
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    p-3.5
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-sm

                    sm:p-[var(--space-card-sm)]
                  "
                >
                  <Avatar
                    user={
                      friend.user
                    }
                    large
                  />

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-[var(--text)]
                        transition
                        group-hover:text-[var(--primary)]
                      "
                    >
                      {
                        friend
                          .user.name
                      }
                    </div>

                    <p
                      className="
                        mt-1
                        line-clamp-2
                        break-words
                        text-xs
                        leading-5
                        text-[var(--text-muted)]
                      "
                    >
                      {friend.user.bio ??
                        friend.user.role}
                    </p>
                  </div>
                </Link>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({
  user,
  large = false,
}: {
  user: User;
  large?: boolean;
}) {
  const size = large
    ? "h-12 w-12"
    : "h-[var(--control-height)] w-10";

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
      {initials(user.name)}
    </div>
  );
}