"use client";

import Link from "next/link";
import {
  BookOpenText,
  Braces,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserRound,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { formatDate } from "@/lib/format";

type ContributionItem = {
  id: string;
  title: string;
  language?: string | null;
  updatedAt: string | Date;
};

type PublicProfile = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string | Date;

  _count: {
    snippets: number;
    documents: number;
    threads: number;
  };

  snippets: ContributionItem[];
  documents: ContributionItem[];
  threads: ContributionItem[];
};

type FriendshipStatus =
  | "SELF"
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "FRIENDS";

type FriendshipData = {
  id: string | null;
  status: FriendshipStatus;
};

type ProfileClientProps = {
  initialData: {
    profile: PublicProfile;
    friendship: FriendshipData;
  };
};

type ActivityItem = ContributionItem & {
  type: "snippet" | "document" | "forum";
};

export default function UserProfileClient({
  initialData,
}: ProfileClientProps) {
  const [profile] = useState<PublicProfile>(
    initialData.profile,
  );

  const [friendship, setFriendship] =
    useState<FriendshipData>(
      initialData.friendship,
    );

  const [actionLoading, setActionLoading] =
    useState(false);

  const activities = useMemo<ActivityItem[]>(() => {
    return [
      ...profile.snippets.map((item) => ({
        ...item,
        type: "snippet" as const,
      })),

      ...profile.documents.map((item) => ({
        ...item,
        type: "document" as const,
      })),

      ...profile.threads.map((item) => ({
        ...item,
        type: "forum" as const,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      )
      .slice(0, 8);
  }, [profile]);

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function addFriend() {
    try {
      setActionLoading(true);

      const response = await fetch(
        "/api/friends/request",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: profile.id,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to send friend request.",
        );
      }

      setFriendship({
        id:
          data.friendship?.id ??
          data.id ??
          null,
        status: "PENDING_SENT",
      });

      window.dispatchEvent(
        new CustomEvent(
          "devknowledge:friendship-changed",
        ),
      );
    } catch (error) {
      console.error(
        "SEND FRIEND REQUEST:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to send friend request.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function acceptFriend() {
    if (!friendship.id) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/friends/${friendship.id}/accept`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to accept friend request.",
        );
      }

      setFriendship((current) => ({
        ...current,
        status: "FRIENDS",
      }));

      window.dispatchEvent(
        new CustomEvent(
          "devknowledge:friendship-changed",
        ),
      );
    } catch (error) {
      console.error(
        "ACCEPT FRIEND REQUEST:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to accept friend request.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function rejectFriend() {
    if (!friendship.id) {
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/friends/${friendship.id}/reject`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to decline friend request.",
        );
      }

      setFriendship({
        id: null,
        status: "NONE",
      });

      window.dispatchEvent(
        new CustomEvent(
          "devknowledge:friendship-changed",
        ),
      );
    } catch (error) {
      console.error(
        "DECLINE FRIEND REQUEST:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to decline friend request.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* PROFILE */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* AVATAR */}
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="
                    h-32
                    w-32
                    rounded-full
                    border
                    border-[var(--border)]
                    object-cover

                    sm:h-36
                    sm:w-36

                    lg:h-[280px]
                    lg:w-[280px]
                  "
                />
              ) : (
                <div
                  className="
                    grid
                    h-32
                    w-32
                    place-items-center
                    rounded-full
                    border
                    border-[var(--border)]
                    bg-[var(--surface-soft)]
                    text-3xl
                    font-semibold
                    tracking-[-0.05em]

                    sm:h-36
                    sm:w-36

                    lg:h-[280px]
                    lg:w-[280px]
                    lg:text-5xl
                  "
                >
                  {initials}
                </div>
              )}

              {/* NAME */}
              <h1 className="mt-[var(--space-section-small)] text-2xl font-semibold tracking-[-0.03em]">
                {profile.name}
              </h1>

              {/* ROLE */}
              <p className="mt-1 text-sm capitalize text-[var(--text-muted)]">
                {profile.role.toLowerCase()}
              </p>

              {/* BIO */}
              {profile.bio ? (
                <p
                  className="
                    mx-auto
                    mt-[var(--space-section-small)]
                    max-w-md
                    text-sm
                    leading-6
                    text-[var(--text-soft)]

                    lg:mx-0
                    lg:max-w-none
                  "
                >
                  {profile.bio}
                </p>
              ) : (
                <p className="mt-[var(--space-section-small)] text-sm italic text-[var(--text-muted)]">
                  No bio added yet.
                </p>
              )}

              {/* FRIENDSHIP ACTION */}
              <div className="mt-[var(--space-section-small)] w-full max-w-sm lg:max-w-none">
                {friendship.status === "NONE" ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      void addFriend()
                    }
                    className="
                      inline-flex
                      h-[var(--control-height)]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[var(--primary)]
                      px-[var(--space-inline)]
                      text-sm
                      font-medium
                      text-white
                      transition

                      hover:opacity-90
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {actionLoading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}

                    Add friend
                  </button>
                ) : null}

                {friendship.status ===
                "PENDING_SENT" ? (
                  <div
                    className="
                      flex
                      h-[var(--control-height)]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-[var(--border)]
                      bg-[var(--surface)]
                      text-sm
                      font-medium
                      text-[var(--text-muted)]
                    "
                  >
                    <Clock3 className="h-4 w-4" />
                    Request sent
                  </div>
                ) : null}

                {friendship.status ===
                "PENDING_RECEIVED" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void acceptFriend()
                      }
                      className="
                        inline-flex
                        h-[var(--control-height)]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[var(--primary)]
                        px-3
                        text-sm
                        font-medium
                        text-white
                        transition
                        hover:opacity-90
                        disabled:opacity-50
                      "
                    >
                      {actionLoading ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}

                      Accept
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        void rejectFriend()
                      }
                      className="
                        inline-flex
                        h-[var(--control-height)]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-[var(--border)]
                        bg-[var(--surface)]
                        px-3
                        text-sm
                        font-medium
                        transition
                        hover:bg-[var(--surface-soft)]
                        disabled:opacity-50
                      "
                    >
                      <X className="h-4 w-4" />
                      Decline
                    </button>
                  </div>
                ) : null}

                {friendship.status === "FRIENDS" ? (
                  <div
                    className="
                      flex
                      h-[var(--control-height)]
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      border
                      border-[var(--border)]
                      bg-[var(--surface)]
                      text-sm
                      font-medium
                    "
                  >
                    <UserCheck className="h-4 w-4 text-[var(--primary)]" />
                    Friends
                  </div>
                ) : null}

                {friendship.status === "SELF" ? (
                  <Link
                    href="/profile"
                    className="
                      flex
                      h-[var(--control-height)]
                      w-full
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-[var(--border)]
                      bg-[var(--surface)]
                      text-sm
                      font-medium
                      transition
                      hover:bg-[var(--surface-soft)]
                    "
                  >
                    View your profile
                  </Link>
                ) : null}
              </div>

              {/* INFO */}
              <div className="mt-[var(--space-section-small)] space-y-2.5 text-sm text-[var(--text-soft)]">
                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />

                  <span>
                    {profile.role}
                  </span>
                </div>

                <div className="flex items-center justify-center gap-2 lg:justify-start">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />

                  <span>
                    Joined{" "}
                    {formatDate(
                      profile.createdAt,
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="min-w-0">
          {/* OVERVIEW TAB */}
          <div className="border-b border-[var(--border)]">
            <div className="inline-flex items-center gap-2 border-b-2 border-[var(--text)] px-[var(--space-inline)] pb-3 text-sm font-medium">
              <UserRound className="h-4 w-4" />
              Overview
            </div>
          </div>

          {/* CONTRIBUTIONS */}
          <section className="mt-[var(--space-section)]">
            <h2 className="mb-3 text-sm font-semibold">
              DevKnowledge contributions
            </h2>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard
                icon={Braces}
                label="Code Snippets"
                value={
                  profile._count
                    .snippets
                }
                href="/snippets"
              />

              <StatCard
                icon={BookOpenText}
                label="Documentation"
                value={
                  profile._count
                    .documents
                }
                href="/documentation"
              />

              <StatCard
                icon={
                  MessageSquareText
                }
                label="Discussions"
                value={
                  profile._count
                    .threads
                }
                href="/forum"
              />
            </div>
          </section>

          {/* CONTRIBUTION OVERVIEW */}
          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                Contribution overview
              </h2>

              <span className="text-xs text-[var(--text-muted)]">
                Recent activity
              </span>
            </div>

            {/* MOBILE */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-[var(--space-card-sm)] md:hidden">
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({
                  length: 35,
                }).map((_, index) => {
                  const level =
                    index <
                    activities.length * 3
                      ? (index % 4) + 1
                      : 0;

                  return (
                    <ContributionCell
                      key={index}
                      level={level}
                    />
                  );
                })}
              </div>
            </div>

            {/* DESKTOP */}
            <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-[var(--space-card-sm)] md:block">
              <div className="grid grid-cols-14 gap-1 lg:grid-cols-20">
                {Array.from({
                  length: 140,
                }).map((_, index) => {
                  const level =
                    index <
                    activities.length * 3
                      ? (index % 4) + 1
                      : 0;

                  return (
                    <ContributionCell
                      key={index}
                      level={level}
                    />
                  );
                })}
              </div>
            </div>

            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Contribution visualization based
              on recent public knowledge activity.
            </p>
          </section>

          {/* RECENT CONTRIBUTIONS */}
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">
              Recent contributions
            </h2>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              {activities.length === 0 ? (
                <div className="px-[var(--space-card)] py-10 text-center text-sm text-[var(--text-muted)]">
                  No public contributions yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {activities.map((item) => (
                    <ContributionRow
                      key={`${item.type}-${item.id}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Stat Card
|--------------------------------------------------------------------------
*/

function StatCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="
        min-w-0
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-3
        transition

        hover:border-[var(--border-strong)]
        hover:shadow-sm

        sm:p-[var(--space-card-sm)]
      "
    >
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />

        <span className="text-lg font-semibold sm:text-xl">
          {value}
        </span>
      </div>

      <div className="mt-3 truncate text-[10px] font-medium text-[var(--text-soft)] sm:mt-[var(--space-section-small)] sm:text-xs">
        {label}
      </div>
    </Link>
  );
}

/*
|--------------------------------------------------------------------------
| Contribution Cell
|--------------------------------------------------------------------------
*/

function ContributionCell({
  level,
}: {
  level: number;
}) {
  return (
    <div
      className={[
        "aspect-square rounded-[4px] border border-[var(--border)]",

        level === 0
          ? "bg-[var(--surface-soft)]"
          : "",

        level === 1
          ? "bg-[color-mix(in_srgb,var(--primary)_25%,var(--surface))]"
          : "",

        level === 2
          ? "bg-[color-mix(in_srgb,var(--primary)_45%,var(--surface))]"
          : "",

        level === 3
          ? "bg-[color-mix(in_srgb,var(--primary)_65%,var(--surface))]"
          : "",

        level === 4
          ? "bg-[var(--primary)]"
          : "",
      ].join(" ")}
    />
  );
}

/*
|--------------------------------------------------------------------------
| Contribution Row
|--------------------------------------------------------------------------
*/

function ContributionRow({
  item,
}: {
  item: ActivityItem;
}) {
  const href =
    item.type === "snippet"
      ? `/snippets/${item.id}`
      : item.type === "document"
        ? `/documentation/${item.id}`
        : `/forum/${item.id}`;

  const label =
    item.type === "snippet"
      ? "Snippet"
      : item.type === "document"
        ? "Documentation"
        : "Discussion";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        gap-3
        px-[var(--space-inline)]
        py-[var(--space-row-y)].5
        transition

        hover:bg-[var(--surface-soft)]

        sm:gap-[var(--space-card-sm)]
        sm:px-[var(--space-card)]
        sm:py-[var(--space-row-y)]
      "
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {item.title}
        </div>

        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{label}</span>

          {item.language ? (
            <>
              <span>·</span>

              <span className="truncate">
                {item.language}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-[10px] text-[var(--text-muted)] sm:text-xs">
        {formatDate(
          item.updatedAt,
        )}
      </div>
    </Link>
  );
}