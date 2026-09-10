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

export default function FriendsPage() {
  const [friends, setFriends] =
    useState<Friend[]>([]);

  const [incoming, setIncoming] =
    useState<Incoming[]>([]);

  const [outgoing, setOutgoing] =
    useState<Outgoing[]>([]);

  const [results, setResults] =
    useState<User[]>([]);

  const [query, setQuery] =
    useState("");

  const [loading, setLoading] =
    useState(true);

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
            "Failed to load friends."
          );
        }

        const data =
          await response.json();

        setFriends(
          data.friends ?? []
        );

        setIncoming(
          data.incoming ?? []
        );

        setOutgoing(
          data.outgoing ?? []
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadFriends();
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
                query.trim()
              )}`
            );

          if (!response.ok) {
            return;
          }

          const data =
            await response.json();

          setResults(
            data.users ?? []
          );
        },
        300
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  async function addFriend(
    userId: string
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
      }
    );

    setResults((current) =>
      current.filter(
        (item) =>
          item.id !== userId
      )
    );

    await loadFriends();
  }

  async function accept(
    friendshipId: string
  ) {
    await fetch(
      `/api/friends/${friendshipId}/accept`,
      {
        method: "POST",
      }
    );

    await loadFriends();
  }

  async function reject(
    friendshipId: string
  ) {
    await fetch(
      `/api/friends/${friendshipId}/reject`,
      {
        method: "POST",
      }
    );

    await loadFriends();
  }

  if (loading) {
    return (
      <Spinner label="Loading friends" />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-[var(--text-muted)]">
          <Users className="h-4 w-4" />
          Community
        </div>

        <h1 className="mt-2 text-2xl font-semibold">
          Friends
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Connect with developers and
          discover what your teammates
          are sharing.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Find developers
        </h2>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search by name or email..."
            className="field h-10 w-full pl-9 pr-3 text-sm"
          />
        </div>

        {results.length > 0 ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
            {results.map(
              (user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
                >
                  <Avatar user={user} />

                  <Link
                    href={`/profile/${user.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="truncate text-sm font-medium">
                      {user.name}
                    </div>

                    <div className="text-xs text-[var(--text-muted)]">
                      {user.role}
                    </div>
                  </Link>

                  <button
                    onClick={() =>
                      addFriend(
                        user.id
                      )
                    }
                    className="inline-flex h-8 items-center gap-2 rounded-lg border border-[var(--border)] px-3 text-xs font-medium"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>
              )
            )}
          </div>
        ) : null}
      </section>

      {incoming.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Friend requests
          </h2>

          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            {incoming.map(
              (item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0"
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

                    <div className="text-xs text-[var(--text-muted)]">
                      {
                        item
                          .requester
                          .role
                      }
                    </div>
                  </Link>

                  <button
                    onClick={() =>
                      accept(
                        item.id
                      )
                    }
                    className="rounded-lg bg-[var(--text)] p-2 text-[var(--background)]"
                  >
                    <Check className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() =>
                      reject(
                        item.id
                      )
                    }
                    className="rounded-lg border border-[var(--border)] p-2"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      ) : null}

      {outgoing.length > 0 ? (
        <section>
          <h2 className="mb-3 text-sm font-semibold">
            Sent requests
          </h2>

          <div className="overflow-hidden rounded-xl border border-[var(--border)]">
            {outgoing.map(
              (item) => (
                <Link
                  key={item.id}
                  href={`/profile/${item.addressee.id}`}
                  className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-soft)]"
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

                    <div className="text-xs text-[var(--text-muted)]">
                      Waiting for
                      approval
                    </div>
                  </div>

                  <Clock3 className="h-4 w-4 text-[var(--text-muted)]" />
                </Link>
              )
            )}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold">
          Your friends
        </h2>

        {friends.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] px-6 py-12 text-center text-sm text-[var(--text-muted)]">
            No friends yet.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {friends.map(
              (friend) => (
                <Link
                  key={
                    friend.friendshipId
                  }
                  href={`/profile/${friend.user.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:shadow-sm"
                >
                  <Avatar
                    user={
                      friend.user
                    }
                  />

                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {
                        friend
                          .user.name
                      }
                    </div>

                    <div className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {friend.user.bio ??
                        friend.user.role}
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Avatar({
  user,
}: {
  user: User;
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
      {initials(user.name)}
    </div>
  );
}