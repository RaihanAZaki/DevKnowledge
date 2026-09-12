"use client";

import Link from "next/link";
import {
  BookOpenText,
  Braces,
  CalendarDays,
  Check,
  Clock3,
  MessageSquareText,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";

import {
  useCallback,
  useState,
} from "react";

import { Spinner } from "@/components/ui";
import { formatDate, initials } from "@/lib/format";

type Item = {
  id: string;
  title: string;
  language?: string;
  updatedAt: string;
};

type Profile = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;

  _count: {
    snippets: number;
    documents: number;
    threads: number;
  };

  snippets: Item[];
  documents: Item[];
  threads: Item[];
};

type FriendshipStatus =
  | "SELF"
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "FRIENDS";

export default function UserProfileClient({ userId, initialData }: { userId: string; initialData: { profile: Profile; friendship: { id: string | null; status: FriendshipStatus } } }) {
  const [profile, setProfile] =
    useState<Profile | null>(initialData.profile);

  const [friendshipId, setFriendshipId] =
    useState<string | null>(initialData.friendship.id);

  const [status, setStatus] =
    useState<FriendshipStatus>(initialData.friendship.status);

  const [loading, setLoading] =
    useState(false);

  const [working, setWorking] =
    useState(false);

  const loadProfile = useCallback(
    async () => {
      if (!userId) {
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `/api/profile/${userId}`
        );

        if (response.status === 401) {
          window.location.href =
            "/login";
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load profile."
          );
        }

        const data =
          await response.json();

        setProfile(data.profile);

        setFriendshipId(
          data.friendship.id
        );

        setStatus(
          data.friendship.status
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  async function addFriend() {
    if (!profile) return;

    try {
      setWorking(true);

      const response = await fetch(
        "/api/friends/request",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId: profile.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to send request."
        );
      }

      await loadProfile();
    } finally {
      setWorking(false);
    }
  }

  async function acceptFriend() {
    if (!friendshipId) return;

    try {
      setWorking(true);

      await fetch(
        `/api/friends/${friendshipId}/accept`,
        {
          method: "POST",
        }
      );

      await loadProfile();
    } finally {
      setWorking(false);
    }
  }

  async function removeFriend() {
    if (!friendshipId) return;

    try {
      setWorking(true);

      await fetch(
        `/api/friends/${friendshipId}`,
        {
          method: "DELETE",
        }
      );

      await loadProfile();
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return (
      <Spinner label="Loading profile" />
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-[var(--border)] p-8">
        User not found.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside>
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="aspect-square w-full rounded-full border border-[var(--border)] object-cover"
            />
          ) : (
            <div className="grid aspect-square w-full place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-5xl font-semibold">
              {initials(profile.name)}
            </div>
          )}

          <h1 className="mt-5 text-2xl font-semibold">
            {profile.name}
          </h1>

          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {profile.role}
          </p>

          {profile.bio ? (
            <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
              {profile.bio}
            </p>
          ) : null}

          <div className="mt-5">
            {status === "NONE" ? (
              <button
                onClick={addFriend}
                disabled={working}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--text)] px-4 text-sm font-medium text-[var(--background)]"
              >
                <UserPlus className="h-4 w-4" />
                Add friend
              </button>
            ) : null}

            {status ===
            "PENDING_SENT" ? (
              <button
                disabled
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-sm text-[var(--text-muted)]"
              >
                <Clock3 className="h-4 w-4" />
                Request sent
              </button>
            ) : null}

            {status ===
            "PENDING_RECEIVED" ? (
              <button
                onClick={acceptFriend}
                disabled={working}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--text)] text-sm font-medium text-[var(--background)]"
              >
                <Check className="h-4 w-4" />
                Accept friend
              </button>
            ) : null}

            {status === "FRIENDS" ? (
              <button
                onClick={removeFriend}
                disabled={working}
                className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] text-sm font-medium"
              >
                <UserMinus className="h-4 w-4" />
                Friends
              </button>
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <CalendarDays className="h-4 w-4" />
            Joined{" "}
            {formatDate(
              profile.createdAt
            )}
          </div>
        </aside>

        <main>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={Braces}
              label="Snippets"
              value={
                profile._count.snippets
              }
            />

            <StatCard
              icon={BookOpenText}
              label="Documentation"
              value={
                profile._count.documents
              }
            />

            <StatCard
              icon={
                MessageSquareText
              }
              label="Discussions"
              value={
                profile._count.threads
              }
            />
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">
              Recent contributions
            </h2>

            <div className="overflow-hidden rounded-xl border border-[var(--border)]">
              {[
                ...profile.snippets.map(
                  (item) => ({
                    ...item,
                    type: "snippet",
                  })
                ),

                ...profile.documents.map(
                  (item) => ({
                    ...item,
                    type: "document",
                  })
                ),

                ...profile.threads.map(
                  (item) => ({
                    ...item,
                    type: "forum",
                  })
                ),
              ]
                .sort(
                  (a, b) =>
                    new Date(
                      b.updatedAt
                    ).getTime() -
                    new Date(
                      a.updatedAt
                    ).getTime()
                )
                .slice(0, 10)
                .map((item) => {
                  const href =
                    item.type ===
                    "snippet"
                      ? `/snippets/${item.id}`
                      : item.type ===
                          "document"
                        ? `/documentation/${item.id}`
                        : `/forum/${item.id}`;

                  return (
                    <Link
                      key={`${item.type}-${item.id}`}
                      href={href}
                      className="block border-b border-[var(--border)] px-5 py-4 last:border-b-0 hover:bg-[var(--surface-soft)]"
                    >
                      <div className="text-sm font-medium">
                        {item.title}
                      </div>

                      <div className="mt-1 text-xs text-[var(--text-muted)]">
                        {formatDate(
                          item.updatedAt
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <Icon className="h-4 w-4 text-[var(--primary)]" />

      <div className="mt-4 text-2xl font-semibold">
        {value}
      </div>

      <div className="mt-1 text-xs text-[var(--text-muted)]">
        {label}
      </div>
    </div>
  );
}