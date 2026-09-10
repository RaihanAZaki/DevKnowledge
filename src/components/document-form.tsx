"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Globe2,
  LoaderCircle,
  Lock,
  Save,
} from "lucide-react";

import {
  Button,
  Input,
  Label,
  Textarea,
} from "@/components/ui";

import {
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
} from "@/lib/constants";

export type DocumentFormValues = {
  title: string;
  excerpt: string;
  content: string;
  language: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  visibility: "PUBLIC" | "PRIVATE";
};

const empty: DocumentFormValues = {
  title: "",
  excerpt: "",
  content:
    "# Title\n\nStart writing your documentation here...",
  language: "TypeScript",
  category: "GENERAL",
  tags: [],
  isPublished: true,
  visibility: "PUBLIC",
};

export function DocumentForm({
  initial,
  id,
}: {
  initial?: DocumentFormValues;
  id?: string;
}) {
  const router = useRouter();

  const [value, setValue] =
    useState<DocumentFormValues>(
      initial ?? empty
    );

  const [tagsText, setTagsText] =
    useState(
      (initial?.tags ?? []).join(", ")
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const set = (
    key: keyof DocumentFormValues,
    next:
      | string
      | boolean
      | "PUBLIC"
      | "PRIVATE"
  ) => {
    setValue((current) => ({
      ...current,
      [key]: next,
    }));
  };

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    const payload = {
      ...value,

      tags: tagsText
        .split(",")
        .map((tag) =>
          tag.trim()
        )
        .filter(Boolean),
    };

    const response = await fetch(
      id
        ? `/api/documentation/${id}`
        : "/api/documentation",
      {
        method: id ? "PUT" : "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      setError(
        data.error ??
          "Unable to save document."
      );

      setLoading(false);
      return;
    }

    router.push(
      `/documentation/${data.document.id}`
    );

    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >
      <div className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>
            Title
          </Label>

          <Input
            value={
              value.title
            }
            onChange={(e) =>
              set(
                "title",
                e.target.value
              )
            }
            placeholder="Understanding Prisma migrations"
            required
          />
        </div>

        <div>
          <Label>
            Language
          </Label>

          <Input
            value={
              value.language
            }
            onChange={(e) =>
              set(
                "language",
                e.target.value
              )
            }
            placeholder="TypeScript"
            required
          />
        </div>

        <div>
          <Label>
            Category
          </Label>

          <select
            className="field h-11 w-full px-3.5 text-sm"
            value={
              value.category
            }
            onChange={(e) =>
              set(
                "category",
                e.target.value
              )
            }
          >
            {CATEGORY_OPTIONS.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {
                    CATEGORY_LABEL[
                      item
                    ]
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="md:col-span-2">
          <Label>
            Excerpt
          </Label>

          <Input
            value={
              value.excerpt ??
              ""
            }
            onChange={(e) =>
              set(
                "excerpt",
                e.target.value
              )
            }
            placeholder="One-line summary shown in the document list"
          />
        </div>

        <div className="md:col-span-2">
          <Label>
            Tags
          </Label>

          <Input
            value={
              tagsText
            }
            onChange={(e) =>
              setTagsText(
                e.target.value
              )
            }
            placeholder="jwt, auth, security"
          />

          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Separate tags with
            commas.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <div className="mb-3 flex items-center justify-between">
          <Label>
            Markdown content
          </Label>

          <span className="text-xs text-[var(--text-muted)]">
            Markdown supported
          </span>
        </div>

        <Textarea
          className="min-h-[520px] font-mono text-[13px] leading-6"
          value={
            value.content
          }
          onChange={(e) =>
            set(
              "content",
              e.target.value
            )
          }
          required
        />
      </div>

      {/* VISIBILITY */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <Label>
          Visibility
        </Label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() =>
              set(
                "visibility",
                "PUBLIC"
              )
            }
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              value.visibility ===
              "PUBLIC"
                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />

            <div>
              <div className="text-sm font-medium">
                Public
              </div>

              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Visible to all
                signed-in members.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              set(
                "visibility",
                "PRIVATE"
              )
            }
            className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
              value.visibility ===
              "PRIVATE"
                ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                : "border-[var(--border)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />

            <div>
              <div className="text-sm font-medium">
                Private
              </div>

              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                Only you and
                friends you share
                this document with
                can view it.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* PUBLISHED */}
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <input
          type="checkbox"
          checked={
            value.isPublished
          }
          onChange={(e) =>
            set(
              "isPublished",
              e.target.checked
            )
          }
          className="h-4 w-4 accent-[var(--primary)]"
        />

        <span>
          <span className="block text-sm font-medium">
            Published
          </span>

          <span className="text-xs text-[var(--text-muted)]">
            {value.visibility ===
            "PRIVATE"
              ? "Private documents remain limited to you and explicitly shared friends."
              : "Public documents are visible to signed-in members when published."}
          </span>
        </span>
      </label>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Link
          href={
            id
              ? `/documentation/${id}`
              : "/documentation"
          }
          className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] hover:text-[var(--text)]"
        >
          <ArrowLeft className="h-4 w-4" />

          Cancel
        </Link>

        <Button
          disabled={
            loading
          }
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {id
            ? "Save changes"
            : "Create document"}
        </Button>
      </div>
    </form>
  );
}