"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  Send,
  Trash2,
} from "lucide-react";

import { Badge, Button, GhostButton, Textarea } from "@/components/ui";

import { CATEGORY_LABEL } from "@/lib/constants";
import { formatDate, initials } from "@/lib/format";

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

  category: keyof typeof CATEGORY_LABEL;

  tags: string[];

  authorId: string;

  createdAt: string;

  author: {
    name: string;
  };

  comments: Comment[];
};

type ForumData = {
  thread: Thread;

  canManage: boolean;

  currentUserId: string;
};

export default function ForumDetailClient({ id, initialData }: { id: string; initialData: ForumData }) {
  const router = useRouter();
  const [data, setData] = useState<ForumData>(initialData);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const response = await fetch(`/api/forum/${id}`);
    const json = await response.json();
    setData(json);
  }

  async function reply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!replyText.trim()) {
      return;
    }

    setSending(true);

    const response = await fetch(`/api/forum/${id}/comments`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        content: replyText.trim(),
      }),
    });

    setSending(false);

    if (response.ok) {
      setReplyText("");

      load();
    }
  }

  async function accept(commentId: string) {
    const response = await fetch(
      `/api/forum/${id}/comments/${commentId}/accept`,
      {
        method: "PUT",
      },
    );

    if (response.ok) {
      load();
    }
  }

  async function deleteComment() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);

    const response = await fetch(`/api/forum/${id}/comments/${deleteTarget}`, {
      method: "DELETE",
    });

    setDeleting(false);

    if (response.ok) {
      setDeleteTarget(null);

      load();
    }
  }

  async function removeThread() {
    const confirm = window.confirm("Delete this discussion?");

    if (!confirm) {
      return;
    }

    const response = await fetch(`/api/forum/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.push("/forum");
    }
  }

  const thread = data.thread;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/forum"
        className="
mb-7
inline-flex
items-center
gap-2
text-sm
text-[var(--text-soft)]
"
      >
        <ArrowLeft className="h-4 w-4" />
        Forum
      </Link>

      <section
        className="
rounded-2xl
border
border-[var(--border)]
bg-[var(--surface)]
p-6
sm:p-8
"
      >
        <div
          className="
flex
items-start
justify-between
gap-4
"
        >
          <div>
            <div
              className="
flex
gap-2
"
            >
              <Badge>{CATEGORY_LABEL[thread.category]}</Badge>

              {thread.comments.some((item) => item.isAccepted) && (
                <Badge tone="success">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Solved
                </Badge>
              )}
            </div>

            <h1
              className="
mt-4
text-3xl
font-semibold
tracking-[-0.04em]
"
            >
              {thread.title}
            </h1>

            <p
              className="
mt-5
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
mt-5
text-xs
text-[var(--text-muted)]
"
            >
              Asked by {thread.author.name}
              {" · "}
              {formatDate(thread.createdAt)}
            </div>
          </div>

          {data.canManage && (
            <GhostButton onClick={removeThread} className="text-red-500">
              <Trash2 className="h-4 w-4" />
            </GhostButton>
          )}
        </div>

        {thread.tags.length > 0 && (
          <div
            className="
mt-5
flex
gap-2
"
          >
            {thread.tags.map((tag) => (
              <span
                key={tag}
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
            ))}
          </div>
        )}
      </section>

      <div
        className="
mt-7
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
          {thread.comments.length} replies
        </h2>
      </div>

      <div
        className="
mt-3
space-y-3
"
      >
        {thread.comments.map((comment) => (
          <article
            key={comment.id}
            className={`
rounded-2xl
border
bg-[var(--surface)]
p-5

${comment.isAccepted ? "border-emerald-300/60" : "border-[var(--border)]"}

`}
          >
            <div className="flex gap-3">
              <div
                className="
grid
h-9
w-9
place-items-center
rounded-full
bg-[var(--surface-soft)]
text-xs
font-semibold
"
              >
                {initials(comment.author.name)}
              </div>

              <div className="flex-1">
                <div
className="
flex
items-center
justify-between
gap-3
"
>

  <div
    className="
    flex
    items-center
    gap-2
    "
  >

    <span className="text-sm font-medium">
      {comment.author.name}
    </span>


    <span
      className="
      text-xs
      text-[var(--text-muted)]
      "
    >
      {formatDate(comment.createdAt)}
    </span>


    {comment.isAccepted && (
      <Badge tone="success">
        Accepted solution
      </Badge>
    )}

  </div>



  {(comment.author.id === data.currentUserId ||
    data.canManage) && (

    <button
      onClick={() => setDeleteTarget(comment.id)}
      className="
      inline-flex
      items-center
      gap-1.5
      text-xs
      font-medium
      text-red-500
      hover:text-red-600
      "
    >

      <Trash2 className="h-3.5 w-3.5"/>

      Delete

    </button>

  )}

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
  {comment.content}
</p>



{data.canManage && !comment.isAccepted && (

<button
onClick={() => accept(comment.id)}
className="
mt-4
inline-flex
items-center
gap-1.5
text-xs
font-medium
text-[var(--success)]
"
>

<CheckCircle2 className="h-3.5 w-3.5"/>

Mark as solution

</button>

)}
              </div>
            </div>
          </article>
        ))}
      </div>

      <form
        onSubmit={reply}
        className="
mt-5
rounded-2xl
border
border-[var(--border)]
bg-[var(--surface)]
p-5
"
      >
        <div className="mb-3 text-sm font-semibold">Add your reply</div>

        <Textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          className="min-h-[150px]"
          placeholder="Share the reasoning, fix, or trade-off..."
          required
        />

        <div className="mt-3 flex justify-end">
          <Button disabled={sending}>
            {sending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Reply
          </Button>
        </div>
      </form>

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
h-10
w-10
place-items-center
rounded-full
bg-red-100
text-red-600
"
              >
                <Trash2 className="h-5 w-5" />
              </div>

              <div>
                <h3 className="font-semibold">Delete comment?</h3>

                <p
                  className="
mt-1
text-sm
text-[var(--text-soft)]
"
                >
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div
              className="
mt-6
flex
justify-end
gap-3
"
            >
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="
rounded-xl
border
px-4
py-2
text-sm
"
              >
                Cancel
              </button>

              <button
                disabled={deleting}
                onClick={deleteComment}
                className="
rounded-xl
bg-red-500
px-4
py-2
text-sm
font-medium
text-white
"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
