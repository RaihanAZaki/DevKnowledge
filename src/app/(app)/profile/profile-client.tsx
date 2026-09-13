"use client";

import Link from "next/link";
import {
  BookOpenText,
  Braces,
  CalendarDays,
  Camera,
  Edit3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { Spinner } from "@/components/ui";
import { formatDate } from "@/lib/format";

type ContributionItem = {
  id: string;
  title: string;
  language?: string;
  updatedAt: string;
};

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;

  _count: {
    snippets: number;
    documents: number;
    threads: number;
  };

  snippets: ContributionItem[];
  documents: ContributionItem[];
  threads: ContributionItem[];
};

type ReputationData = {
  score: number;
  threads: number;
  replies: number;
  solved: number;
};

type ProfileClientProps = {
  initialProfile: Profile;
  initialReputation: ReputationData;
};

type ActivityItem = ContributionItem & {
  type:
    | "snippet"
    | "document"
    | "forum";
};

export default function ProfileClient({
  initialProfile,
  initialReputation,
}: ProfileClientProps) {
  const avatarInputRef =
    useRef<HTMLInputElement>(null);

  const [profile, setProfile] =
    useState<Profile | null>(
      initialProfile,
    );

  const [reputation] =
    useState<ReputationData>(
      initialReputation,
    );

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [
    uploadingAvatar,
    setUploadingAvatar,
  ] =
    useState(false);

  const [
    removingAvatar,
    setRemovingAvatar,
  ] =
    useState(false);

  const [name, setName] =
    useState(initialProfile.name);

  const [bio, setBio] =
    useState(
      initialProfile.bio ?? "",
    );

  const loadProfile =
    useCallback(async () => {
      try {
        setLoading(true);

        const response =
          await fetch("/api/profile", {
            cache: "no-store",
          });

        if (
          response.status === 401
        ) {
          window.location.href =
            "/login";
          return;
        }

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load profile.",
          );
        }

        if (!data.profile) {
          throw new Error(
            "Profile data was not returned by API.",
          );
        }

        setProfile(
          data.profile,
        );

        setName(
          data.profile.name ?? "",
        );

        setBio(
          data.profile.bio ?? "",
        );
      } catch (error) {
        console.error(
          "Load profile error:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }, []);

  async function saveProfile() {
    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/profile",
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,
              bio,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update profile.",
        );
      }

      await loadProfile();

      setEditing(false);
    } catch (error) {
      console.error(
        "Update profile error:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(
    file: File,
  ) {
    try {
      setUploadingAvatar(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
      );

      const response =
        await fetch(
          "/api/profile/avatar",
          {
            method: "POST",
            body: formData,
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to update profile photo.",
        );
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                avatarUrl:
                  data.profile
                    .avatarUrl,
              }
            : current,
      );
    } catch (error) {
      console.error(
        "UPLOAD PROFILE AVATAR:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to update profile photo.",
      );
    } finally {
      setUploadingAvatar(false);

      if (
        avatarInputRef.current
      ) {
        avatarInputRef.current.value =
          "";
      }
    }
  }

  async function removeAvatar() {
    try {
      setRemovingAvatar(true);

      const response =
        await fetch(
          "/api/profile/avatar",
          {
            method: "DELETE",
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Unable to remove profile photo.",
        );
      }

      setProfile(
        (current) =>
          current
            ? {
                ...current,
                avatarUrl: null,
              }
            : current,
      );
    } catch (error) {
      console.error(
        "REMOVE PROFILE AVATAR:",
        error,
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to remove profile photo.",
      );
    } finally {
      setRemovingAvatar(false);
    }
  }

  const activities =
    useMemo<ActivityItem[]>(
      () => {
        if (!profile) {
          return [];
        }

        return [
          ...profile.snippets.map(
            (item) => ({
              ...item,
              type:
                "snippet" as const,
            }),
          ),

          ...profile.documents.map(
            (item) => ({
              ...item,
              type:
                "document" as const,
            }),
          ),

          ...profile.threads.map(
            (item) => ({
              ...item,
              type:
                "forum" as const,
            }),
          ),
        ]
          .sort(
            (a, b) =>
              new Date(
                b.updatedAt,
              ).getTime() -
              new Date(
                a.updatedAt,
              ).getTime(),
          )
          .slice(0, 8);
      },
      [profile],
    );

  if (loading) {
    return (
      <Spinner label="Loading profile" />
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">
        Profile could not be
        loaded.
      </div>
    );
  }

  const initials =
    profile.name
      .split(" ")
      .filter(Boolean)
      .map(
        (item) =>
          item[0],
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const mobileContributionCells =
    35;

  const desktopContributionCells =
    140;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* PROFILE SIDEBAR */}
        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* AVATAR */}
              <div className="relative">
                {profile.avatarUrl ? (
                  <img
                    src={
                      profile.avatarUrl
                    }
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
                    bottom-1
                    right-1
                    grid
                    h-10
                    w-10
                    place-items-center
                    rounded-full
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    shadow-md
                    transition

                    hover:bg-[var(--primary)]
                    hover:text-white

                    disabled:cursor-not-allowed
                    disabled:opacity-50

                    lg:bottom-3
                    lg:right-3
                  "
                  aria-label="Change profile photo"
                  title="Change profile photo"
                >
                  {uploadingAvatar ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>

                <input
                  ref={
                    avatarInputRef
                  }
                  type="file"
                  accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                  hidden
                  onChange={(
                    event,
                  ) => {
                    const file =
                      event.target
                        .files?.[0];

                    if (file) {
                      void uploadAvatar(
                        file,
                      );
                    }
                  }}
                />
              </div>

              <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
                {profile.name}
              </h1>

              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {profile.email
                  .split("@")[0]
                  .toLowerCase()}
              </p>

              {profile.bio ? (
                <p
                  className="
                    mx-auto
                    mt-4
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
                <p className="mt-4 text-sm italic text-[var(--text-muted)]">
                  No bio added yet.
                </p>
              )}

              <button
                type="button"
                onClick={() =>
                  setEditing(true)
                }
                className="
                  mt-5
                  flex
                  h-10
                  w-full
                  max-w-sm
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  text-sm
                  font-medium
                  transition
                  hover:bg-[var(--surface-hover)]

                  lg:max-w-none
                "
              >
                <Edit3 className="h-4 w-4" />
                Edit profile
              </button>

              {profile.avatarUrl ? (
                <button
                  type="button"
                  disabled={
                    removingAvatar
                  }
                  onClick={() =>
                    void removeAvatar()
                  }
                  className="
                    mt-2
                    flex
                    h-9
                    w-full
                    max-w-sm
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    text-xs
                    font-medium
                    text-red-500
                    transition
                    hover:bg-red-50

                    disabled:opacity-50

                    lg:max-w-none
                  "
                >
                  {removingAvatar ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}

                  Remove photo
                </button>
              ) : null}
            </div>

            {/* REPUTATION */}
            <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Reputation
                  </p>

                  <h2 className="mt-1 text-3xl font-semibold">
                    ⭐{" "}
                    {
                      reputation.score
                    }
                  </h2>
                </div>

                <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  🏆
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3 text-center lg:text-left">
                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Threads
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      reputation.threads
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Replies
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      reputation.replies
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-[var(--text-muted)]">
                    Solved
                  </p>

                  <p className="mt-1 font-semibold">
                    {
                      reputation.solved
                    }
                  </p>
                </div>
              </div>
            </section>

            {/* BADGES */}
            <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
              {reputation.solved >
              0 ? (
                <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
                  🏆 Problem Solver
                </span>
              ) : null}

              {reputation.score >=
              100 ? (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                  🔥 Top Contributor
                </span>
              ) : null}
            </div>

            {/* INFO */}
            <div className="mt-5 space-y-2.5 text-sm text-[var(--text-soft)]">
              <div className="flex items-center justify-center gap-2 lg:justify-start">
                <Mail className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />

                <span className="min-w-0 truncate">
                  {profile.email}
                </span>
              </div>

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
        </aside>

        {/* PROFILE CONTENT */}
        <main className="min-w-0">
          <div className="border-b border-[var(--border)]">
            <div className="inline-flex items-center gap-2 border-b-2 border-[var(--text)] px-4 pb-3 text-sm font-medium">
              <UserRound className="h-4 w-4" />
              Overview
            </div>
          </div>

          <section className="mt-6">
            <div className="mb-3 text-sm font-semibold">
              DevKnowledge contributions
            </div>

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
                icon={
                  BookOpenText
                }
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

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">
                Contribution overview
              </h2>

              <span className="text-xs text-[var(--text-muted)]">
                Recent activity
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:hidden">
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({
                  length:
                    mobileContributionCells,
                }).map(
                  (
                    _,
                    index,
                  ) => {
                    const level =
                      index <
                      activities.length *
                        3
                        ? (index %
                            4) +
                          1
                        : 0;

                    return (
                      <ContributionCell
                        key={
                          index
                        }
                        level={
                          level
                        }
                      />
                    );
                  },
                )}
              </div>
            </div>

            <div className="hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 md:block">
              <div className="grid grid-cols-14 gap-1 lg:grid-cols-20">
                {Array.from({
                  length:
                    desktopContributionCells,
                }).map(
                  (
                    _,
                    index,
                  ) => {
                    const level =
                      index <
                      activities.length *
                        3
                        ? (index %
                            4) +
                          1
                        : 0;

                    return (
                      <ContributionCell
                        key={
                          index
                        }
                        level={
                          level
                        }
                      />
                    );
                  },
                )}
              </div>
            </div>

            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Contribution visualization
              based on recent knowledge
              activity.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">
              Recent contributions
            </h2>

            <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
              {activities.length ===
              0 ? (
                <div className="px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                  No contributions yet.
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {activities.map(
                    (item) => (
                      <ContributionRow
                        key={`${item.type}-${item.id}`}
                        item={item}
                      />
                    ),
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* EDIT PROFILE */}
      {editing ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <h2 className="font-semibold">
                  Edit profile
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Update your public
                  DevKnowledge profile.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setEditing(false)
                }
                className="grid h-9 w-9 place-items-center rounded-lg hover:bg-[var(--surface-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Name
                </label>

                <input
                  value={name}
                  onChange={(
                    event,
                  ) =>
                    setName(
                      event.target
                        .value,
                    )
                  }
                  className="field h-10 w-full px-3 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(
                    event,
                  ) =>
                    setBio(
                      event.target
                        .value,
                    )
                  }
                  rows={4}
                  placeholder="Tell people about yourself..."
                  className="field w-full resize-none px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
              <button
                type="button"
                onClick={() =>
                  setEditing(false)
                }
                className="h-9 rounded-lg border border-[var(--border)] px-4 text-sm font-medium"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  name.trim()
                    .length < 2
                }
                onClick={
                  saveProfile
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--text)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
        sm:p-4
      "
    >
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />

        <span className="text-lg font-semibold sm:text-xl">
          {value}
        </span>
      </div>

      <div className="mt-3 truncate text-[10px] font-medium text-[var(--text-soft)] sm:mt-4 sm:text-xs">
        {label}
      </div>
    </Link>
  );
}

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

function ContributionRow({
  item,
}: {
  item: ActivityItem;
}) {
  const href =
    item.type === "snippet"
      ? `/snippets/${item.id}`
      : item.type ===
          "document"
        ? `/documentation/${item.id}`
        : `/forum/${item.id}`;

  const label =
    item.type === "snippet"
      ? "Snippet"
      : item.type ===
          "document"
        ? "Documentation"
        : "Discussion";

  return (
    <Link
      href={href}
      className="
        flex
        items-center
        gap-3
        px-4
        py-3.5
        transition
        hover:bg-[var(--surface-soft)]

        sm:gap-4
        sm:px-5
        sm:py-4
      "
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {item.title}
        </div>

        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>
            {label}
          </span>

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