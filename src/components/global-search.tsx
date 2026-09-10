"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SearchItem = {
  id: string;
  title: string;
};

type SearchResponse = {
  snippets: SearchItem[];
  documents: SearchItem[];
  threads: SearchItem[];
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] =
    useState<SearchResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const wrapperRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setResults(null);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        try {
          setLoading(true);

          const response = await fetch(
            `/api/search?q=${encodeURIComponent(
              query.trim()
            )}`,
            {
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error(
              "Search request failed."
            );
          }

          const data =
            (await response.json()) as SearchResponse;

          setResults(data);
        } catch (error) {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          console.error(error);
          setResults(null);
        } finally {
          setLoading(false);
        }
      },
      300
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function closeSearch() {
    setQuery("");
    setResults(null);
  }

  const totalResults =
    (results?.snippets.length ?? 0) +
    (results?.documents.length ?? 0) +
    (results?.threads.length ?? 0);

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <div className="flex h-9 w-[280px] items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 transition focus-within:border-[var(--border-strong)] focus-within:shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />

        <input
          type="search"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search knowledge..."
          className="min-w-0 flex-1 bg-transparent text-xs text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]"
        />

        {loading ? (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        ) : null}
      </div>

      {results ? (
        <div className="absolute right-0 top-11 z-50 w-[380px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <div className="text-xs font-medium">
              Search results
            </div>

            <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
              {totalResults} result
              {totalResults === 1 ? "" : "s"}{" "}
              for &quot;{query}&quot;
            </div>
          </div>

          {totalResults === 0 ? (
            <div className="px-4 py-8 text-center">
              <Search className="mx-auto h-5 w-5 text-[var(--text-muted)]" />

              <div className="mt-3 text-sm font-medium">
                No results found
              </div>

              <div className="mt-1 text-xs text-[var(--text-muted)]">
                Try another keyword.
              </div>
            </div>
          ) : (
            <div className="max-h-[430px] overflow-y-auto p-2">
              {results.snippets.length >
              0 ? (
                <SearchGroup
                  title="Code Snippets"
                  items={results.snippets}
                  href={(id) =>
                    `/snippets/${id}`
                  }
                  onSelect={closeSearch}
                />
              ) : null}

              {results.documents.length >
              0 ? (
                <SearchGroup
                  title="Documentation"
                  items={results.documents}
                  href={(id) =>
                    `/documentation/${id}`
                  }
                  onSelect={closeSearch}
                />
              ) : null}

              {results.threads.length > 0 ? (
                <SearchGroup
                  title="Forum"
                  items={results.threads}
                  href={(id) =>
                    `/forum/${id}`
                  }
                  onSelect={closeSearch}
                />
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({
  title,
  items,
  href,
  onSelect,
}: {
  title: string;
  items: SearchItem[];
  href: (id: string) => string;
  onSelect: () => void;
}) {
  return (
    <div className="py-1">
      <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
        {title}
      </div>

      {items.map((item) => (
        <Link
          key={item.id}
          href={href(item.id)}
          onClick={onSelect}
          className="block rounded-xl px-3 py-2.5 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
        >
          <span className="block truncate">
            {item.title}
          </span>
        </Link>
      ))}
    </div>
  );
}