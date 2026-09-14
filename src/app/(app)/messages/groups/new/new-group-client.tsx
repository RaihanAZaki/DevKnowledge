"use client";

import {
  ArrowLeft,
  Check,
  LoaderCircle,
  Search,
  Users,
} from "lucide-react";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

type Friend = {
  id: string;
  name: string;
  email: string;
  avatarUrl:
    | string
    | null;
};

export default function NewGroupClient({
  initialFriends,
}: {
  initialFriends: Friend[];
}) {
  const router =
    useRouter();

  const [name, setName] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    selected,
    setSelected,
  ] =
    useState<string[]>([]);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [error, setError] =
    useState<string | null>(
      null,
    );

  const friends =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return initialFriends;
      }

      return initialFriends.filter(
        (friend) =>
          `${friend.name} ${friend.email}`
            .toLowerCase()
            .includes(query),
      );
    }, [
      initialFriends,
      search,
    ]);

  function toggle(
    userId: string,
  ) {
    setSelected(
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

  async function create() {
    try {
      setSaving(true);
      setError(null);

      const response =
        await fetch(
          "/api/messages/groups",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name,
              description,
              memberIds:
                selected,
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

      router.push(
        `/messages/groups/${data.group.id}`,
      );

      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to create group.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/messages/groups"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition hover:text-[var(--text)]"
      >
        <ArrowLeft className="h-4 w-4" />

        Group chats
      </Link>

      <div className="mt-[var(--space-section)]">
        <h1 className="text-2xl font-semibold tracking-[-0.03em]">
          Create group
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Create a private group
          with your friends.
        </p>
      </div>

      {error && (
        <div className="mt-[var(--space-section-small)] rounded-xl border border-red-200 bg-red-50 px-[var(--space-inline)] py-[var(--space-row-y)] text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-[var(--space-section)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="space-y-[var(--space-section-small)] p-[var(--space-card)]">
          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Group name
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
              placeholder="Backend Team"
              className="field h-[var(--control-height-lg)] w-full px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium">
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
                )
              }
              rows={3}
              placeholder="Optional description..."
              className="field w-full resize-none px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="border-t border-[var(--border)] p-[var(--space-card)]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">
                Members
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {
                  selected.length
                }{" "}
                selected
              </p>
            </div>

            <Users className="h-4 w-4 text-[var(--text-muted)]" />
          </div>

          <div className="relative mt-[var(--space-section-small)]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

            <input
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search friends..."
              className="field h-[var(--control-height)] w-full pl-9 pr-3 text-sm"
            />
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto">
            {friends.map(
              (friend) => {
                const active =
                  selected.includes(
                    friend.id,
                  );

                return (
                  <button
                    key={
                      friend.id
                    }
                    type="button"
                    onClick={() =>
                      toggle(
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
                      hover:bg-[var(--surface-soft)]
                    "
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface-soft)] text-xs font-semibold">
                      {friend.name
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
                      <p className="truncate text-sm font-medium">
                        {
                          friend.name
                        }
                      </p>

                      <p className="truncate text-xs text-[var(--text-muted)]">
                        {
                          friend.email
                        }
                      </p>
                    </div>

                    <div
                      className={`
                        grid
                        h-5
                        w-5
                        place-items-center
                        rounded-md
                        border

                        ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[var(--border-strong)]"
                        }
                      `}
                    >
                      {active && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  </button>
                );
              },
            )}

            {friends.length ===
              0 && (
              <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                No friends found.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--border)] p-[var(--space-card)]">
          <Link
            href="/messages/groups"
            className="inline-flex h-[var(--control-height)] items-center rounded-xl border border-[var(--border)] px-[var(--space-inline)] text-sm font-medium"
          >
            Cancel
          </Link>

          <button
            type="button"
            disabled={
              saving ||
              name.trim()
                .length < 2 ||
              selected.length ===
                0
            }
            onClick={
              create
            }
            className="inline-flex h-[var(--control-height)] items-center gap-2 rounded-xl bg-[var(--text)] px-[var(--space-inline)] text-sm font-medium text-[var(--background)] disabled:opacity-50"
          >
            {saving && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}

            {saving
              ? "Creating..."
              : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}