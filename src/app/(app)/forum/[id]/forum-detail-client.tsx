"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

import {
  Badge,
  Button,
  GhostButton,
  Textarea,
} from "@/components/ui";

import {
  CATEGORY_LABEL,
} from "@/lib/constants";

import {
  formatDate,
  initials,
} from "@/lib/format";

type Comment = {
  id: string;
  content: string;
  isAccepted: boolean;
  createdAt: string;

  author: {
    id: string;
    name: string;
    role: string;
  };
};

type Thread = {
  id: string;
  title: string;
  content: string;

  category:
    keyof typeof CATEGORY_LABEL;

  tags: string[];

  authorId: string;

  createdAt: string;

  author: {
    id: string;
    name: string;
    role: string;
  };

  comments: Comment[];
};

type ForumData = {
  thread: Thread;

  canManage: boolean;

  isThreadOwner: boolean;

  currentUserId: string;
};

type Props = {
  id: string;

  initialData: ForumData;
};

export default function ForumDetailClient({
  id,
  initialData,
}: Props) {
  const router =
    useRouter();

  const [data, setData] =
    useState<ForumData>(
      initialData,
    );

  const [
    replyText,
    setReplyText,
  ] =
    useState("");

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    acceptingCommentId,
    setAcceptingCommentId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    deleteTarget,
    setDeleteTarget,
  ] =
    useState<string | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] =
    useState(false);

  async function load() {
    const response =
      await fetch(
        `/api/forum/${id}`,
        {
          cache: "no-store",
        },
      );

    if (!response.ok) {
      return;
    }

    const json =
      (await response.json()) as ForumData;

    setData(json);
  }

  async function reply(
    event:
      React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const content =
      replyText.trim();

    if (!content) {
      return;
    }

    try {
      setSending(true);

      const response =
        await fetch(
          `/api/forum/${id}/comments`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                content,
              }),
          },
        );

      if (!response.ok) {
        return;
      }

      setReplyText("");

      await load();

      router.refresh();
    } finally {
      setSending(false);
    }
  }

  async function accept(
    commentId: string,
  ) {
    if (
      !data.isThreadOwner
    ) {
      return;
    }

    try {
      setAcceptingCommentId(
        commentId,
      );

      const response =
        await fetch(
          `/api/forum/${id}/comments/${commentId}/accept`,
          {
            method:
              "PUT",
          },
        );

      if (!response.ok) {
        return;
      }

      await load();

      router.refresh();
    } finally {
      setAcceptingCommentId(
        null,
      );
    }
  }

  async function deleteComment() {
    if (!deleteTarget) {
      return;
    }

    try {
      setDeleting(true);

      const response =
        await fetch(
          `/api/forum/${id}/comments/${deleteTarget}`,
          {
            method:
              "DELETE",
          },
        );

      if (!response.ok) {
        return;
      }

      setDeleteTarget(
        null,
      );

      await load();

      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  async function removeThread() {
    const confirmed =
      window.confirm(
        "Delete this discussion?",
      );

    if (!confirmed) {
      return;
    }

    const response =
      await fetch(
        `/api/forum/${id}`,
        {
          method:
            "DELETE",
        },
      );

    if (response.ok) {
      router.push(
        "/forum",
      );

      router.refresh();
    }
  }

  const thread =
    data.thread;

  return (
    <div className="mx-auto max-w-5xl">
      {/* BACK */}

      <Link
        href="/forum"
        className="
          mb-[var(--space-section)]
          inline-flex
          items-center
          gap-2
          text-sm
          text-[var(--text-soft)]
          transition

          hover:text-[var(--text)]
        "
      >
        <ArrowLeft className="h-4 w-4" />

        Forum
      </Link>

      {/* THREAD */}

      <section
        className="
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-[var(--space-card)]
        "
      >
        <div
          className="
            flex
            items-start
            justify-between
            gap-[var(--space-card-sm)]
          "
        >
          <div className="min-w-0 flex-1">
            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <Badge>
                {
                  CATEGORY_LABEL[
                    thread.category
                  ]
                }
              </Badge>

              {thread.comments.some(
                (
                  comment,
                ) =>
                  comment.isAccepted,
              ) && (
                <Badge tone="success">
                  <CheckCircle2
                    className="
                      mr-1
                      h-3
                      w-3
                    "
                  />

                  Solved
                </Badge>
              )}
            </div>

            <h1
              className="
                mt-[var(--space-section-small)]
                text-3xl
                font-semibold
                tracking-[-0.04em]
              "
            >
              {thread.title}
            </h1>

            <p
              className="
                mt-[var(--space-section-small)]
                whitespace-pre-wrap
                text-sm
                leading-7
                text-[var(--text-soft)]
              "
            >
              {thread.content}
            </p>

            <div
              className="
                mt-[var(--space-section-small)]
                text-xs
                text-[var(--text-muted)]
              "
            >
              Asked by{" "}
              {
                thread.author
                  .name
              }

              {" · "}

              {formatDate(
                thread.createdAt,
              )}
            </div>

            {thread.tags.length >
              0 && (
              <div
                className="
                  mt-[var(--space-section-small)]
                  flex
                  flex-wrap
                  gap-2
                "
              >
                {thread.tags.map(
                  (tag) => (
                    <span
                      key={
                        tag
                      }
                      className="
                        rounded-lg
                        bg-[var(--surface-soft)]
                        px-2.5
                        py-1
                        text-xs
                        text-[var(--text-muted)]
                      "
                    >
                      #{tag}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>

          {/* EDIT + DELETE */}

          {data.canManage && (
            <div
              className="
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              <Link
                href={`/forum/${id}/edit`}
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
                  px-3.5
                  text-sm
                  font-medium
                  text-[var(--text-soft)]
                  transition

                  hover:border-[var(--primary)]
                  hover:bg-[var(--primary-soft)]
                  hover:text-[var(--primary)]
                "
              >
                <Pencil className="h-4 w-4" />

                Edit
              </Link>

              <GhostButton
                onClick={
                  removeThread
                }
                className="
                  text-red-500
                "
                title="Delete discussion"
              >
                <Trash2 className="h-4 w-4" />
              </GhostButton>
            </div>
          )}
        </div>
      </section>

      {/* REPLIES HEADER */}

      <div
        className="
          mt-[var(--space-section)]
          flex
          items-center
          gap-2
        "
      >
        <MessageSquareText
          className="
            h-4
            w-4
            text-[var(--primary)]
          "
        />

        <h2
          className="
            text-sm
            font-semibold
          "
        >
          {
            thread.comments
              .length
          }{" "}
          {thread.comments
            .length === 1
            ? "reply"
            : "replies"}
        </h2>
      </div>

      {/* COMMENTS */}

      <div
        className="
          mt-3
          space-y-[var(--space-section-small)]
        "
      >
        {thread.comments.map(
          (comment) => {
            const canDelete =
              comment.author.id ===
                data.currentUserId ||
              data.canManage;

            const accepting =
              acceptingCommentId ===
              comment.id;

            return (
              <article
                key={
                  comment.id
                }
                className={`
                  rounded-2xl
                  border
                  bg-[var(--surface)]
                  p-[var(--space-card)]
                  transition

                  ${
                    comment.isAccepted
                      ? `
                        border-emerald-400/70
                        ring-1
                        ring-emerald-400/30
                      `
                      : `
                        border-[var(--border)]
                      `
                  }
                `}
              >
                <div
                  className="
                    flex
                    gap-3
                  "
                >
                  <div
                    className="
                      grid
                      h-9
                      w-9
                      shrink-0
                      place-items-center
                      rounded-full
                      bg-[var(--surface-soft)]
                      text-xs
                      font-semibold
                    "
                  >
                    {initials(
                      comment
                        .author
                        .name,
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      "
                    >
                      <div
                        className="
                          flex
                          min-w-0
                          flex-wrap
                          items-center
                          gap-2
                        "
                      >
                        <span
                          className="
                            text-sm
                            font-medium
                          "
                        >
                          {
                            comment
                              .author
                              .name
                          }
                        </span>

                        <span
                          className="
                            text-xs
                            text-[var(--text-muted)]
                          "
                        >
                          {formatDate(
                            comment.createdAt,
                          )}
                        </span>

                        {comment.isAccepted && (
                          <Badge tone="success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />

                            Accepted
                            solution
                          </Badge>
                        )}
                      </div>

                      <div
                        className="
                          flex
                          shrink-0
                          items-center
                          gap-1.5
                        "
                      >
                        {/* ACCEPT */}

                        {data.isThreadOwner &&
                          !comment.isAccepted && (
                            <button
                              type="button"
                              disabled={
                                accepting
                              }
                              onClick={() =>
                                accept(
                                  comment.id,
                                )
                              }
                              title="Mark as accepted solution"
                              className="
                                inline-flex
                                h-8
                                w-8
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-[var(--border)]
                                text-[var(--text-muted)]
                                transition

                                hover:border-emerald-400
                                hover:bg-emerald-50
                                hover:text-emerald-600

                                disabled:cursor-not-allowed
                                disabled:opacity-50

                                dark:hover:bg-emerald-950/30
                              "
                            >
                              {accepting ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}

                        {/* ACCEPTED */}

                        {comment.isAccepted && (
                          <div
                            title="Accepted solution"
                            className="
                              inline-flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-emerald-400
                              bg-emerald-50
                              text-emerald-600

                              dark:bg-emerald-950/30
                            "
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}

                        {/* DELETE COMMENT */}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(
                                comment.id,
                              )
                            }
                            title="Delete comment"
                            className="
                              inline-flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              text-red-500
                              transition

                              hover:bg-red-50
                              hover:text-red-600

                              dark:hover:bg-red-950/30
                            "
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p
                      className="
                        mt-3
                        whitespace-pre-wrap
                        text-sm
                        leading-7
                        text-[var(--text-soft)]
                      "
                    >
                      {
                        comment.content
                      }
                    </p>

                    {comment.isAccepted && (
                      <div
                        className="
                          mt-[var(--space-section-small)]
                          inline-flex
                          items-center
                          gap-2
                          rounded-lg
                          bg-emerald-50
                          px-3
                          py-2
                          text-xs
                          font-medium
                          text-emerald-700

                          dark:bg-emerald-950/30
                          dark:text-emerald-400
                        "
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />

                        Accepted by
                        discussion owner
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          },
        )}
      </div>

      {/* REPLY FORM */}

      <form
        onSubmit={reply}
        className="
          mt-[var(--space-section)]
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-[var(--space-card)]
        "
      >
        <div
          className="
            mb-3
            text-sm
            font-semibold
          "
        >
          Add your reply
        </div>

        <Textarea
          value={replyText}
          onChange={(
            event,
          ) =>
            setReplyText(
              event.target
                .value,
            )
          }
          className="min-h-[150px]"
          placeholder="Share the reasoning, fix, or trade-off..."
          required
        />

        <div
          className="
            mt-3
            flex
            justify-end
          "
        >
          <Button
            disabled={
              sending
            }
          >
            {sending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}

            Reply
          </Button>
        </div>
      </form>

      {/* DELETE COMMENT MODAL */}

      {deleteTarget && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-[var(--space-card-sm)]
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-6
              shadow-xl
            "
          >
            <div
              className="
                flex
                gap-3
              "
            >
              <div
                className="
                  grid
                  h-[var(--control-height)]
                  w-10
                  shrink-0
                  place-items-center
                  rounded-full
                  bg-red-100
                  text-red-600
                "
              >
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold">
                  Delete
                  comment?
                </h3>

                <p
                  className="
                    mt-1
                    text-sm
                    text-[var(--text-soft)]
                  "
                >
                  This action
                  cannot be
                  undone.
                </p>
              </div>
            </div>

            <div
              className="
                mt-[var(--space-section)]
                flex
                justify-end
                gap-3
              "
            >
              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={() =>
                  setDeleteTarget(
                    null,
                  )
                }
                className="
                  rounded-xl
                  border
                  border-[var(--border)]
                  px-[var(--space-inline)]
                  py-2
                  text-sm
                  transition

                  hover:bg-[var(--surface-soft)]
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  deleting
                }
                onClick={
                  deleteComment
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-red-500
                  px-[var(--space-inline)]
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition

                  hover:bg-red-600
                  disabled:opacity-50
                "
              >
                {deleting && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}