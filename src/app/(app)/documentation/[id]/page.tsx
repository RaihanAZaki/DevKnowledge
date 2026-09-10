"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Globe2,
  Lock,
  Pencil,
  Share2,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { MarkdownContent } from "@/components/markdown-content";
import {
  Badge,
  GhostButton,
  Spinner,
} from "@/components/ui";
import { CATEGORY_LABEL } from "@/lib/constants";
import {
  formatDate,
  initials,
} from "@/lib/format";

type Friend = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatarUrl: string | null;
};

type Share = {
  id: string;
  userId: string;
  user: Friend;
};

type Doc = {
  id: string;
  title: string;
  excerpt?: string;
  content: string;
  language: string;
  category: keyof typeof CATEGORY_LABEL;
  tags: string[];
  isPublished: boolean;

  visibility: "PUBLIC" | "PRIVATE";

  authorId: string;

  author: {
    id?: string;
    name: string;
  };

  updatedAt: string;

  sharedWith?: Array<{
    id: string;
    userId: string;
  }>;
};

type DocumentResponse = {
  document: Doc;
  canManage: boolean;

  access?: {
    isOwner: boolean;
    isPublic: boolean;
    isShared: boolean;
  };
};

export default function DocumentDetailPage() {
  const { id } = useParams<{
    id: string;
  }>();

  const router = useRouter();

  const [data, setData] =
    useState<DocumentResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [shareOpen, setShareOpen] =
    useState(false);

  const [friends, setFriends] =
    useState<Friend[]>([]);

  const [shares, setShares] =
    useState<Share[]>([]);

  const [shareLoading, setShareLoading] =
    useState(false);

  const [workingUserId, setWorkingUserId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/documentation/${id}`
        );

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 403) {
          setError(
            "You do not have access to this document."
          );
          return;
        }

        if (response.status === 404) {
          setError(
            "Document not found."
          );
          return;
        }

        if (!response.ok) {
          throw new Error(
            "Failed to load document."
          );
        }

        const result =
          (await response.json()) as DocumentResponse;

        setData(result);
      } catch (error) {
        console.error(error);

        setError(
          "Failed to load document."
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadDocument();
    }
  }, [id]);

  async function remove() {
    const confirmed = confirm(
      "Delete this document permanently?"
    );

    if (!confirmed) {
      return;
    }

    const response = await fetch(
      `/api/documentation/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      router.push("/documentation");
      router.refresh();
    }
  }

  async function openShareModal() {
    try {
      setShareOpen(true);
      setShareLoading(true);

      const [friendsResponse, sharesResponse] =
        await Promise.all([
          fetch("/api/friends"),
          fetch(
            `/api/documentation/${id}/shared-with`
          ),
        ]);

      if (friendsResponse.ok) {
        const result =
          await friendsResponse.json();

        setFriends(
          (result.friends ?? []).map(
            (item: {
              friendshipId: string;
              user: Friend;
            }) => item.user
          )
        );
      }

      if (sharesResponse.ok) {
        const result =
          await sharesResponse.json();

        setShares(
          result.shares ?? []
        );
      }
    } catch (error) {
      console.error(
        "Failed to load sharing data:",
        error
      );
    } finally {
      setShareLoading(false);
    }
  }

  async function shareWith(
    userId: string
  ) {
    try {
      setWorkingUserId(userId);

      const response = await fetch(
        `/api/documentation/${id}/share`,
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

      if (!response.ok) {
        const result =
          await response.json();

        alert(
          result?.error ||
            "Failed to share document."
        );

        return;
      }

      const result =
        await response.json();

      setShares((current) => {
        const exists =
          current.some(
            (item) =>
              item.userId === userId
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          result.share,
        ];
      });
    } catch (error) {
      console.error(error);
    } finally {
      setWorkingUserId(null);
    }
  }

  async function removeShare(
    userId: string
  ) {
    try {
      setWorkingUserId(userId);

      const response = await fetch(
        `/api/documentation/${id}/share`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            userId,
          }),
        }
      );

      if (!response.ok) {
        const result =
          await response.json();

        alert(
          result?.error ||
            "Failed to remove access."
        );

        return;
      }

      setShares((current) =>
        current.filter(
          (item) =>
            item.userId !== userId
        )
      );
    } catch (error) {
      console.error(error);
    } finally {
      setWorkingUserId(null);
    }
  }

  function isSharedWith(
    userId: string
  ) {
    return shares.some(
      (item) =>
        item.userId === userId
    );
  }

  if (loading) {
    return (
      <Spinner label="Loading document" />
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)]">
          <Lock className="h-5 w-5 text-[var(--text-muted)]" />
        </div>

        <h1 className="mt-4 text-lg font-semibold">
          Document unavailable
        </h1>

        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {error}
        </p>

        <Link
          href="/documentation"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Documentation
        </Link>
      </div>
    );
  }

  if (!data?.document) {
    return (
      <Spinner label="Loading document" />
    );
  }

  const d = data.document;

  const isOwner =
    data.access?.isOwner ??
    data.canManage;

  return (
    <>
      <div className="mx-auto max-w-5xl">
        <Link
          href="/documentation"
          className="mb-7 inline-flex items-center gap-2 text-sm text-[var(--text-soft)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Documentation
        </Link>

        <header className="border-b border-[var(--border)] pb-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge>
                  {
                    CATEGORY_LABEL[
                      d.category
                    ]
                  }
                </Badge>

                <Badge>
                  {d.language}
                </Badge>

                {!d.isPublished ? (
                  <Badge tone="warning">
                    Draft
                  </Badge>
                ) : null}

                {d.visibility ===
                "PRIVATE" ? (
                  <Badge>
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Private
                    </span>
                  </Badge>
                ) : (
                  <Badge>
                    <span className="inline-flex items-center gap-1">
                      <Globe2 className="h-3 w-3" />
                      Public
                    </span>
                  </Badge>
                )}

                {data.access
                  ?.isShared &&
                !data.access
                  ?.isOwner ? (
                  <Badge>
                    <span className="inline-flex items-center gap-1">
                      <UserCheck className="h-3 w-3" />
                      Shared with you
                    </span>
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em]">
                {d.title}
              </h1>

              {d.excerpt ? (
                <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--text-soft)]">
                  {d.excerpt}
                </p>
              ) : null}

              <p className="mt-4 text-xs text-[var(--text-muted)]">
                Written by{" "}
                {d.author.name} · Updated{" "}
                {formatDate(
                  d.updatedAt
                )}
              </p>
            </div>

            {data.canManage ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={
                    openShareModal
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)]"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>

                <Link
                  href={`/documentation/${id}/edit`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Link>

                <GhostButton
                  onClick={remove}
                  className="text-[var(--danger)]"
                >
                  <Trash2 className="h-4 w-4" />
                </GhostButton>
              </div>
            ) : null}
          </div>

          {d.tags.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {d.tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[var(--surface-soft)] px-2.5 py-1 text-xs text-[var(--text-muted)]"
                  >
                    #{tag}
                  </span>
                )
              )}
            </div>
          ) : null}
        </header>

        <article className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-7 sm:px-9 sm:py-9">
          <MarkdownContent
            content={d.content}
          />
        </article>
      </div>

      {shareOpen &&
      isOwner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />

                  <h2 className="font-semibold">
                    Share document
                  </h2>
                </div>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Give your friends read
                  access to this document.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShareOpen(false)
                }
                className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[420px] overflow-y-auto p-3">
              {shareLoading ? (
                <div className="py-10">
                  <Spinner label="Loading friends" />
                </div>
              ) : friends.length ===
                0 ? (
                <div className="px-5 py-10 text-center">
                  <Users className="mx-auto h-5 w-5 text-[var(--text-muted)]" />

                  <div className="mt-3 text-sm font-medium">
                    No friends yet
                  </div>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Add friends before
                    sharing private
                    documents.
                  </p>
                </div>
              ) : (
                friends.map(
                  (friend) => {
                    const shared =
                      isSharedWith(
                        friend.id
                      );

                    return (
                      <div
                        key={
                          friend.id
                        }
                        className="flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--surface-soft)]"
                      >
                        {friend.avatarUrl ? (
                          <img
                            src={
                              friend.avatarUrl
                            }
                            alt={
                              friend.name
                            }
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                            {initials(
                              friend.name
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">
                            {
                              friend.name
                            }
                          </div>

                          <div className="mt-0.5 text-xs text-[var(--text-muted)]">
                            {
                              friend.role
                            }
                          </div>
                        </div>

                        {shared ? (
                          <button
                            type="button"
                            disabled={
                              workingUserId ===
                              friend.id
                            }
                            onClick={() =>
                              removeShare(
                                friend.id
                              )
                            }
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--danger)] disabled:opacity-50"
                          >
                            {workingUserId ===
                            friend.id
                              ? "..."
                              : "Remove"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={
                              workingUserId ===
                              friend.id
                            }
                            onClick={() =>
                              shareWith(
                                friend.id
                              )
                            }
                            className="rounded-lg bg-[var(--text)] px-3 py-1.5 text-xs font-medium text-[var(--background)] disabled:opacity-50"
                          >
                            {workingUserId ===
                            friend.id
                              ? "..."
                              : "Share"}
                          </button>
                        )}
                      </div>
                    );
                  }
                )
              )}
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                {d.visibility ===
                "PRIVATE" ? (
                  <>
                    <Lock className="h-3.5 w-3.5" />
                    Private document — only
                    selected friends can
                    access it.
                  </>
                ) : (
                  <>
                    <Globe2 className="h-3.5 w-3.5" />
                    Public document — sharing
                    also grants explicit
                    access.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}