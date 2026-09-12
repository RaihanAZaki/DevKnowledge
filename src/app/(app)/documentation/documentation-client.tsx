"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronDown,
  Code2,
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

type Doc = {
  id: string;
  title: string;
  excerpt?: string;
  language: string;
  category: keyof typeof CATEGORY_LABEL;
  tags: string[];
  isPublished: boolean;
  visibility: "PUBLIC" | "PRIVATE";
  updatedAt: string;
  author: {
    name: string;
  };
};

export default function DocumentationClient({ initialItems }: { initialItems: Doc[] }) {
  const [items, setItems] = useState<Doc[] | null>(initialItems);

  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const [scope, setScope] =
    useState<"mine" | "public">("mine");

  const categoryRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  /*
   * LOAD DOCUMENTATION
   */
  useEffect(() => {
    if (scope === "mine") {
      setItems(initialItems);
      return;
    }

    setItems(null);
    const params = new URLSearchParams();
    params.set("scope", scope);

    fetch(`/api/documentation?${params.toString()}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load documentation.");
        return response.json();
      })
      .then((data) => setItems(data.documents ?? []))
      .catch((error) => {
        console.error("Load documentation error:", error);
        setItems([]);
      });
  }, [scope, initialItems]);

  /*
   * CLOSE DROPDOWN WHEN CLICKING OUTSIDE
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        categoryRef.current &&
        !categoryRef.current.contains(target)
      ) {
        setCategoryOpen(false);
      }

      if (
        languageRef.current &&
        !languageRef.current.contains(target)
      ) {
        setLanguageOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  /*
   * AVAILABLE LANGUAGES
   */
  const availableLanguages = useMemo(() => {
    return Array.from(
      new Set(
        (items ?? []).map((item) => item.language)
      )
    ).sort();
  }, [items]);

  /*
   * FILTER
   */
  const filtered = useMemo(() => {
    return (items ?? []).filter((item) => {
      const q = search.trim().toLowerCase();

      const matchesSearch =
        !q ||
        `${item.title} ${item.excerpt ?? ""} ${
          item.language
        } ${item.tags.join(" ")}`
          .toLowerCase()
          .includes(q);

      const matchesCategory =
        categories.length === 0 ||
        categories.includes(item.category);

      const matchesLanguage =
        selectedLanguages.length === 0 ||
        selectedLanguages.includes(item.language);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesLanguage
      );
    });
  }, [
    items,
    search,
    categories,
    selectedLanguages,
  ]);

  /*
   * CATEGORY CHECKBOX
   */
  function toggleCategory(category: string) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  /*
   * LANGUAGE CHECKBOX
   */
  function toggleLanguage(language: string) {
    setSelectedLanguages((current) =>
      current.includes(language)
        ? current.filter((item) => item !== language)
        : [...current, language]
    );
  }

  /*
   * CHANGE TAB
   */
  function changeScope(next: "mine" | "public") {
    setScope(next);

    setSearch("");
    setSearchOpen(false);

    setCategories([]);
    setSelectedLanguages([]);

    setCategoryOpen(false);
    setLanguageOpen(false);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge"
        title="Documentation"
        description="A calm, searchable home for implementation notes, technical guides, and team conventions."
        action={
          <Link
            href="/documentation/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--surface)]"
          >
            <Plus className="h-4 w-4" />
            New document
          </Link>
        }
      />

      {/* TABS + FILTERS */}
      <div className="mb-7 border-b border-[var(--border)]">
        <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-end md:justify-between">
          
          {/* TABS */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => changeScope("mine")}
              className={`relative pb-3 text-sm font-medium transition ${
                scope === "mine"
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              My Documents

              {scope === "mine" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => changeScope("public")}
              className={`relative pb-3 text-sm font-medium transition ${
                scope === "public"
                  ? "text-[var(--text)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              Public Documents

              {scope === "public" && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[var(--primary)]" />
              )}
            </button>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* SEARCH */}
            <div
              className={`flex h-10 items-center overflow-hidden rounded-xl border bg-[var(--surface)] transition-all duration-300 ${
                searchOpen
                  ? "w-64 border-[var(--primary)] px-2"
                  : "w-10 border-[var(--border)]"
              }`}
            >
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="grid h-10 w-10 shrink-0 place-items-center text-[var(--text-muted)]"
                aria-label="Search documentation"
              >
                <Search className="h-4 w-4" />
              </button>

              {searchOpen && (
                <>
                  <input
                    autoFocus
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder="Search..."
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setSearchOpen(false);
                    }}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[var(--text-muted)] transition hover:bg-[var(--surface-hover)]"
                    aria-label="Close search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>

            {/* CATEGORY */}
            <div
              ref={categoryRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setCategoryOpen((current) => !current);
                  setLanguageOpen(false);
                }}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 transition ${
                  categories.length > 0
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                }`}
                aria-label="Filter categories"
              >
                <FolderKanban className="h-4 w-4" />

                {categories.length > 0 && (
                  <span className="text-xs font-semibold">
                    {categories.length}
                  </span>
                )}

                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    categoryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {categoryOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                  <div className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Categories
                  </div>

                  <div className="space-y-0.5">
                    {CATEGORY_OPTIONS.map((item) => {
                      const checked =
                        categories.includes(item);

                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            toggleCategory(item)
                          }
                          className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-[var(--surface-hover)]"
                        >
                          <span
                            className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${
                              checked
                                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                : "border-[var(--border)] bg-[var(--surface)]"
                            }`}
                          >
                            {checked && (
                              <Check className="h-3 w-3" />
                            )}
                          </span>

                          <span className="flex-1">
                            {CATEGORY_LABEL[item]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {categories.length > 0 && (
                    <div className="mt-2 border-t border-[var(--border)] pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCategories([])
                        }
                        className="w-full rounded-xl px-2.5 py-2 text-left text-xs font-medium text-[var(--danger)] transition hover:bg-[var(--surface-hover)]"
                      >
                        Clear categories
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* LANGUAGE */}
            <div
              ref={languageRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() => {
                  setLanguageOpen((current) => !current);
                  setCategoryOpen(false);
                }}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 transition ${
                  selectedLanguages.length > 0
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
                }`}
                aria-label="Filter languages"
              >
                <Code2 className="h-4 w-4" />

                {selectedLanguages.length > 0 && (
                  <span className="text-xs font-semibold">
                    {selectedLanguages.length}
                  </span>
                )}

                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    languageOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
                  <div className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
                    Languages
                  </div>

                  {availableLanguages.length === 0 ? (
                    <div className="px-2.5 py-3 text-sm text-[var(--text-muted)]">
                      No languages available.
                    </div>
                  ) : (
                    <div className="max-h-64 space-y-0.5 overflow-y-auto">
                      {availableLanguages.map((item) => {
                        const checked =
                          selectedLanguages.includes(item);

                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              toggleLanguage(item)
                            }
                            className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm transition hover:bg-[var(--surface-hover)]"
                          >
                            <span
                              className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-md border transition ${
                                checked
                                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                                  : "border-[var(--border)] bg-[var(--surface)]"
                              }`}
                            >
                              {checked && (
                                <Check className="h-3 w-3" />
                              )}
                            </span>

                            <span className="flex-1">
                              {item}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {selectedLanguages.length > 0 && (
                    <div className="mt-2 border-t border-[var(--border)] pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedLanguages([])
                        }
                        className="w-full rounded-xl px-2.5 py-2 text-left text-xs font-medium text-[var(--danger)] transition hover:bg-[var(--surface-hover)]"
                      >
                        Clear languages
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      {!items ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={
            scope === "mine"
              ? "No documents found"
              : "No public documentation found"
          }
          description={
            scope === "mine"
              ? "Create your first documentation or change the current filters."
              : "No other users have published matching documents yet."
          }
          action={
            scope === "mine" ? (
              <Link
                href="/documentation/new"
                className="text-sm font-medium text-[var(--primary)]"
              >
                Create document
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <Link
              href={`/documentation/${item.id}`}
              key={item.id}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BookOpenText className="h-[18px] w-[18px]" />
                </span>

                <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1" />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge>
                  {CATEGORY_LABEL[item.category]}
                </Badge>

                <Badge>
                  {item.language}
                </Badge>

                {scope === "mine" && (
                  <Badge>
                    {item.visibility === "PRIVATE"
                      ? "Private"
                      : "Public"}
                  </Badge>
                )}

                {!item.isPublished && (
                  <Badge tone="warning">
                    Draft
                  </Badge>
                )}
              </div>

              <h2 className="mt-3 text-base font-semibold tracking-[-0.015em]">
                {item.title}
              </h2>

              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-[var(--text-soft)]">
                {item.excerpt || "No excerpt provided."}
              </p>

              <div className="mt-4 text-xs text-[var(--text-muted)]">
                {item.author.name} ·{" "}
                {formatDate(item.updatedAt)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}