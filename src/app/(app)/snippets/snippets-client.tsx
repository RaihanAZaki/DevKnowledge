"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  ArrowRight,
  Braces,
  Check,
  ChevronDown,
  FolderKanban,
  Plus,
  Search,
  X,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import {
  Badge,
  EmptyState,
  Spinner,
} from "@/components/ui";

import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
} from "@/lib/constants";

import { formatDate } from "@/lib/format";

type Snippet = {
  id: string;
  ticketNo: string;
  title: string;
  description?: string;
  language: string;
  framework?: string;
  category: keyof typeof CATEGORY_LABEL;
  updatedAt: string;

  author: {
    name: string;
  };
};

export default function SnippetsClient({
  initialItems,
}: {
  initialItems: Snippet[];
}) {
  const [items] =
    useState<Snippet[] | null>(
      initialItems,
    );

  const [search, setSearch] =
    useState("");

  const [
    searchOpen,
    setSearchOpen,
  ] = useState(false);

  const [
    categoryOpen,
    setCategoryOpen,
  ] = useState(false);

  const [
    selectedCategories,
    setSelectedCategories,
  ] = useState<string[]>([]);

  function toggleCategory(
    value: string,
  ) {
    setSelectedCategories(
      (previous) =>
        previous.includes(value)
          ? previous.filter(
              (item) =>
                item !== value,
            )
          : [
              ...previous,
              value,
            ],
    );
  }

  const filtered =
    useMemo(() => {
      return (
        items ?? []
      ).filter((item) => {
        const keyword =
          search
            .trim()
            .toLowerCase();

        const matchSearch =
          !keyword ||
          `
            ${item.ticketNo}
            ${item.title}
            ${item.description ?? ""}
            ${item.language}
            ${item.framework ?? ""}
          `
            .toLowerCase()
            .includes(keyword);

        const matchCategory =
          selectedCategories.length ===
            0 ||
          selectedCategories.includes(
            item.category,
          );

        return (
          matchSearch &&
          matchCategory
        );
      });
    }, [
      items,
      search,
      selectedCategories,
    ]);

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Code Snippets"
        description="Capture before-and-after code together with the ticket, reason, and impact behind the change."
        action={
          <Link
            href="/snippets/new"
            className="
               inline-flex
    h-10
    items-center
    justify-center
    gap-2
    rounded-xl
    border
    border-[var(--border)]
    bg-white
    px-4
    text-sm
    font-medium
    text-[var(--text)]
    shadow-sm
    transition-all
    hover:border-[var(--primary)]
    hover:text-white
    hover:shadow-md
  ">
            <Plus className="h-4 w-4" />

            New snippet
          </Link>
        }
      />

      {/* FILTER */}

      <div
        className="
          mb-7
          flex
          justify-end
          border-b
          border-[var(--border)]
          pb-5
        "
      >
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {/* SEARCH */}

          <div
            className={`
              flex
              h-10
              items-center
              overflow-hidden
              rounded-xl
              border
              bg-[var(--surface)]
              transition-all

              ${
                searchOpen
                  ? "w-64 border-[var(--primary)]"
                  : "w-10 border-[var(--border)]"
              }
            `}
          >
            <button
              type="button"
              onClick={() =>
                setSearchOpen(true)
              }
              className="
                grid
                h-10
                w-10
                shrink-0
                place-items-center
              "
            >
              <Search className="h-4 w-4" />
            </button>

            {searchOpen && (
              <>
                <input
                  autoFocus
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search snippet..."
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    pr-2
                    text-sm
                    outline-none
                  "
                />

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");

                    setSearchOpen(
                      false,
                    );
                  }}
                  className="
                    grid
                    h-10
                    w-9
                    place-items-center
                    text-[var(--text-muted)]
                    transition
                    hover:text-[var(--text)]
                  "
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* CATEGORY */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setCategoryOpen(
                  (previous) =>
                    !previous,
                )
              }
              className={`
                flex
                h-10
                items-center
                gap-2
                rounded-xl
                border
                bg-[var(--surface)]
                px-3
                transition

                ${
                  categoryOpen ||
                  selectedCategories.length >
                    0
                    ? "border-[var(--primary)]"
                    : "border-[var(--border)]"
                }
              `}
            >
              <FolderKanban className="h-4 w-4" />

              {selectedCategories.length >
                0 && (
                <span
                  className="
                    min-w-5
                    rounded-md
                    bg-[var(--primary-soft)]
                    px-1.5
                    py-0.5
                    text-center
                    text-[10px]
                    font-semibold
                    text-[var(--primary)]
                  "
                >
                  {
                    selectedCategories.length
                  }
                </span>
              )}

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform

                  ${
                    categoryOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {categoryOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-11
                  z-30
                  w-44
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-1.5
                  shadow-xl
                "
              >
                {CATEGORY_OPTIONS.map(
                  (item) => {
                    const selected =
                      selectedCategories.includes(
                        item,
                      );

                    return (
                      <label
                        key={item}
                        className="
                          flex
                          cursor-pointer
                          items-center
                          gap-2.5
                          rounded-lg
                          px-2
                          py-1.5
                          transition
                          hover:bg-[var(--surface-soft)]
                        "
                      >
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={
                            selected
                          }
                          onChange={() =>
                            toggleCategory(
                              item,
                            )
                          }
                        />

                        <div
                          className={`
                            flex
                            h-3.5
                            w-3.5
                            shrink-0
                            items-center
                            justify-center
                            rounded
                            border

                            ${
                              selected
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                : "border-[var(--border-strong)]"
                            }
                          `}
                        >
                          {selected && (
                            <Check className="h-2.5 w-2.5" />
                          )}
                        </div>

                        <span
                          className="
                            text-[13px]
                            text-[var(--text-soft)]
                          "
                        >
                          {
                            CATEGORY_LABEL[
                              item
                            ]
                          }
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {!items ? (
        <Spinner />
      ) : filtered.length ===
        0 ? (
        <EmptyState
          title="No snippets found"
          description="Create the first before-and-after code entry, or adjust your filters."
          action={
            <Link
              href="/snippets/new"
              className="
                text-sm
                font-medium
                text-[var(--primary)]
              "
            >
              Create snippet
            </Link>
          }
        />
      ) : (
        <div
          className="
            overflow-hidden
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
          "
        >
          <div
            className="
              divide-y
              divide-[var(--border)]
            "
          >
            {filtered.map(
              (item) => (
                <Link
                  href={`/snippets/${item.id}`}
                  key={item.id}
                  className="
                    group
                    flex
                    gap-4
                    px-5
                    py-5
                    transition
                    hover:bg-[var(--surface-soft)]
                  "
                >
                  <span
                    className="
                      mt-0.5
                      grid
                      h-9
                      w-9
                      shrink-0
                      place-items-center
                      rounded-xl
                      bg-[var(--primary-soft)]
                      text-[var(--primary)]
                    "
                  >
                    <Braces className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-2
                      "
                    >
                      <span
                        className="
                          text-xs
                          font-semibold
                          text-[var(--primary)]
                        "
                      >
                        {
                          item.ticketNo
                        }
                      </span>

                      <Badge>
                        {
                          CATEGORY_LABEL[
                            item.category
                          ]
                        }
                      </Badge>
                    </div>

                    <h2
                      className="
                        mt-2
                        font-medium
                        tracking-[-0.01em]
                      "
                    >
                      {
                        item.title
                      }
                    </h2>

                    {item.description ? (
                      <p
                        className="
                          mt-1
                          line-clamp-1
                          text-sm
                          text-[var(--text-soft)]
                        "
                      >
                        {
                          item.description
                        }
                      </p>
                    ) : null}

                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        gap-x-3
                        gap-y-1
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      <span>
                        {
                          item.language
                        }

                        {item.framework
                          ? ` · ${item.framework}`
                          : ""}
                      </span>

                      <span>
                        by{" "}
                        {
                          item.author
                            .name
                        }
                      </span>

                      <span>
                        {formatDate(
                          item.updatedAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <ArrowRight
                    className="
                      mt-2
                      h-4
                      w-4
                      shrink-0
                      text-[var(--text-muted)]
                      transition
                      group-hover:translate-x-1
                      group-hover:text-[var(--text)]
                    "
                  />
                </Link>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}