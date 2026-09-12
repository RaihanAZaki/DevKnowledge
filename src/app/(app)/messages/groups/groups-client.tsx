"use client";

import Link from "next/link";

import {
  ArrowRight,
  MessageCircleMore,
  Plus,
  Search,
  Users,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

type Group = {
  id: string;
  name: string;
  description:
    | string
    | null;

  updatedAt: string;

  _count: {
    members: number;
    messages: number;
  };

  messages: Array<{
    id: string;
    content: string;
    createdAt: string;

    sender: {
      id: string;
      name: string;
    };
  }>;
};

export default function GroupsClient({
  initialGroups,
}: {
  initialGroups: Group[];
}) {
  const [search, setSearch] =
    useState("");

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return initialGroups;
      }

      return initialGroups.filter(
        (group) =>
          `${group.name} ${
            group.description ??
            ""
          }`
            .toLowerCase()
            .includes(query),
      );
    }, [
      initialGroups,
      search,
    ]);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">
            Messages
          </p>

          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Group Chats
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Collaborate privately
            with your friends.
          </p>
        </div>

        <Link
          href="/messages/groups/new"
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            bg-[var(--text)]
            px-4
            text-sm
            font-medium
            text-[var(--background)]
          "
        >
          <Plus className="h-4 w-4" />

          New group
        </Link>
      </div>

      <div className="relative mt-6">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

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
          placeholder="Search groups..."
          className="
            field
            h-11
            w-full
            pl-10
            pr-4
            text-sm
          "
        />
      </div>

      <div
        className="
          mt-6
          overflow-hidden
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
        "
      >
        {filtered.length ===
        0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Users className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-semibold">
              No group chats yet
            </h2>

            <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">
              Create a group and
              invite your friends to
              start chatting.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filtered.map(
              (group) => {
                const lastMessage =
                  group
                    .messages[0];

                return (
                  <Link
                    key={
                      group.id
                    }
                    href={`/messages/groups/${group.id}`}
                    className="
                      group
                      flex
                      items-center
                      gap-4
                      px-5
                      py-4
                      transition
                      hover:bg-[var(--surface-soft)]
                    "
                  >
                    <div
                      className="
                        grid
                        h-11
                        w-11
                        shrink-0
                        place-items-center
                        rounded-xl
                        bg-[var(--primary-soft)]
                        text-[var(--primary)]
                      "
                    >
                      <MessageCircleMore className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-sm font-semibold">
                          {
                            group.name
                          }
                        </h2>

                        <span className="shrink-0 text-[11px] text-[var(--text-muted)]">
                          {
                            group
                              ._count
                              .members
                          }{" "}
                          members
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-[var(--text-muted)]">
                        {lastMessage
                          ? `${lastMessage.sender.name}: ${lastMessage.content}`
                          : group.description ||
                            "No messages yet"}
                      </p>
                    </div>

                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition group-hover:translate-x-1" />
                  </Link>
                );
              },
            )}
          </div>
        )}
      </div>
    </div>
  );
}