"use client";

import Link from "next/link";
import {
  BookOpenText,
  Braces,
  CalendarDays,
  Edit3,
  Mail,
  MessageSquareText,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
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

type ProfileResponse = {
  profile: Profile;
};

type ActivityItem = ContributionItem & {
  type: "snippet" | "document" | "forum";
};

export default function ProfilePage() {
  const [profile, setProfile] =
    useState<Profile | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [name, setName] =
    useState("");

  const [bio, setBio] =
    useState("");

  const [avatarUrl, setAvatarUrl] =
    useState("");

  const loadProfile = useCallback(async () => {
  try {
    setLoading(true);

    const response = await fetch("/api/profile");

    if (response.status === 401) {
      window.location.href = "/login";
      return;
    }

    const data = await response.json();

    if (!response.ok) {
      console.error("PROFILE API ERROR:", data);

      throw new Error(
        data?.error || "Failed to load profile."
      );
    }

    if (!data.profile) {
      console.error(
        "Invalid profile response:",
        data
      );

      throw new Error(
        "Profile data was not returned by API."
      );
    }

    setProfile(data.profile);
    setName(data.profile.name ?? "");
    setBio(data.profile.bio ?? "");
    setAvatarUrl(
      data.profile.avatarUrl ?? ""
    );
  } catch (error) {
    console.error(
      "Load profile error:",
      error
    );

    setProfile(null);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function saveProfile() {
    try {
      setSaving(true);

      const response = await fetch(
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
            avatarUrl,
          }),
        }
      );

      if (!response.ok) {
        const data =
          await response.json();

        throw new Error(
          data?.error ||
            "Failed to update profile."
        );
      }

      await loadProfile();

      setEditing(false);
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );
    } finally {
      setSaving(false);
    }
  }

  const activities =
    useMemo<ActivityItem[]>(() => {
      if (!profile) {
        return [];
      }

      return [
        ...profile.snippets.map(
          (item) => ({
            ...item,
            type: "snippet" as const,
          })
        ),

        ...profile.documents.map(
          (item) => ({
            ...item,
            type: "document" as const,
          })
        ),

        ...profile.threads.map(
          (item) => ({
            ...item,
            type: "forum" as const,
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
        .slice(0, 8);
    }, [profile]);

  if (loading) {
    return (
      <Spinner label="Loading profile" />
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-sm text-[var(--text-muted)]">
        Profile could not be loaded.
      </div>
    );
  }

  const initials = profile.name
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="sticky top-24">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="aspect-square w-full max-w-[280px] rounded-full border border-[var(--border)] object-cover"
              />
            ) : (
              <div className="grid aspect-square w-full max-w-[280px] place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] text-5xl font-semibold tracking-[-0.05em]">
                {initials}
              </div>
            )}

            <h1 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">
              {profile.name}
            </h1>

            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {profile.email
                .split("@")[0]
                .toLowerCase()}
            </p>

            {profile.bio ? (
              <p className="mt-4 text-sm leading-6 text-[var(--text-soft)]">
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
              className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium transition hover:bg-[var(--surface-hover)]"
            >
              <Edit3 className="h-4 w-4" />

              Edit profile
            </button>

            <div className="mt-5 space-y-2.5 text-sm text-[var(--text-soft)]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="truncate">
                  {profile.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[var(--text-muted)]" />

                <span>
                  {profile.role}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-[var(--text-muted)]" />

                <span>
                  Joined{" "}
                  {formatDate(
                    profile.createdAt
                  )}
                </span>
              </div>
            </div>
          </div>
        </aside>

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

            <div className="grid gap-3 sm:grid-cols-3">
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

          <section className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Contribution overview
              </h2>

              <span className="text-xs text-[var(--text-muted)]">
                Recent activity
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:grid-cols-14 lg:grid-cols-20">
              {Array.from(
                { length: 140 }
              ).map((_, index) => {
                const level =
                  index <
                  activities.length * 3
                    ? (index % 4) + 1
                    : 0;

                return (
                  <div
                    key={index}
                    className={[
                      "aspect-square rounded-[3px] border border-[var(--border)]",
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
              })}
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
              {activities.length === 0 ? (
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
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
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
                className="rounded-lg p-2 hover:bg-[var(--surface-hover)]"
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
                  onChange={(event) =>
                    setName(
                      event.target.value
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
                  onChange={(event) =>
                    setBio(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Tell people about yourself..."
                  className="field w-full resize-none px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium">
                  Avatar URL
                </label>

                <input
                  value={avatarUrl}
                  onChange={(event) =>
                    setAvatarUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://..."
                  className="field h-10 w-full px-3 text-sm"
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
                  name.trim().length < 2
                }
                onClick={saveProfile}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[var(--text)] px-4 text-sm font-medium text-[var(--background)] disabled:opacity-50"
              >
                <Save className="h-4 w-4" />

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
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--border-strong)] hover:shadow-sm"
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-[var(--primary)]" />

        <span className="text-xl font-semibold">
          {value}
        </span>
      </div>

      <div className="mt-4 text-xs font-medium text-[var(--text-soft)]">
        {label}
      </div>
    </Link>
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
      className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-soft)]"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {item.title}
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span>{label}</span>

          {item.language ? (
            <>
              <span>·</span>

              <span>
                {item.language}
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="shrink-0 text-xs text-[var(--text-muted)]">
        {formatDate(item.updatedAt)}
      </div>
    </Link>
  );
}