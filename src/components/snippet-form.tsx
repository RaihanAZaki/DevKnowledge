"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  ArrowLeft,
  LoaderCircle,
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

export type SnippetFormValue = {
  ticketNo: string;
  title: string;
  description?: string | null;
  reason: string;
  impact?: string | null;
  language: string;
  framework?: string | null;
  category:
    (typeof CATEGORY_OPTIONS)[number];
  beforeCode: string;
  afterCode: string;
};

const empty: SnippetFormValue = {
  ticketNo: "",
  title: "",
  description: "",
  reason: "",
  impact: "",
  language: "TypeScript",
  framework: "Next.js",
  category: "GENERAL",
  beforeCode: "",
  afterCode: "",
};

export function SnippetForm({
  initial,
  id,
}: {
  initial?: SnippetFormValue;
  id?: string;
}) {
  const router = useRouter();

  const [value, setValue] =
    useState<SnippetFormValue>(
      initial ?? empty,
    );

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function set(
    key: keyof SnippetFormValue,
    next: string,
  ) {
    setValue((current) => ({
      ...current,
      [key]: next,
    }));
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        id
          ? `/api/snippets/${id}`
          : "/api/snippets",
        {
          method: id
            ? "PUT"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            value,
          ),
        },
      );

      const text =
        await response.text();

      let data: {
        error?: string;
        snippet?: {
          id: string;
        };
      } | null = null;

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          data = null;
        }
      }

      if (!response.ok) {
        setError(
          data?.error ??
            "Unable to save snippet.",
        );

        return;
      }

      if (!data?.snippet?.id) {
        setError(
          "Snippet was saved, but the server returned an invalid response.",
        );

        return;
      }

      router.push(
        `/snippets/${data.snippet.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SAVE SNIPPET ERROR:",
        error,
      );

      setError(
        "Unable to save snippet.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="
        space-y-[var(--space-section)]
      "
    >
      {/* BASIC INFORMATION */}
      <section
        className="
          grid
          gap-[var(--space-section-small)]
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-[var(--space-card)]

          md:grid-cols-2
        "
      >
        <div>
          <Label>
            Ticket number
          </Label>

          <Input
            value={
              value.ticketNo
            }
            onChange={(event) =>
              set(
                "ticketNo",
                event.target.value,
              )
            }
            placeholder="DEV-1024"
            required
          />
        </div>

        <div>
          <Label>
            Title
          </Label>

          <Input
            value={value.title}
            onChange={(event) =>
              set(
                "title",
                event.target.value,
              )
            }
            placeholder="Fix permission guard on task endpoint"
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
            onChange={(event) =>
              set(
                "language",
                event.target.value,
              )
            }
            placeholder="Java"
            required
          />
        </div>

        <div>
          <Label>
            Framework
          </Label>

          <Input
            value={
              value.framework ?? ""
            }
            onChange={(event) =>
              set(
                "framework",
                event.target.value,
              )
            }
            placeholder="Quarkus"
          />
        </div>

        <div>
          <Label>
            Category
          </Label>

          <select
            className="
              field
              h-11
              w-full
              px-3.5
              text-sm
            "
            value={
              value.category
            }
            onChange={(event) =>
              set(
                "category",
                event.target.value,
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
              ),
            )}
          </select>
        </div>

        <div>
          <Label>
            Short description
          </Label>

          <Input
            value={
              value.description ??
              ""
            }
            onChange={(event) =>
              set(
                "description",
                event.target.value,
              )
            }
            placeholder="What changed in one sentence"
          />
        </div>
      </section>

      {/* CODE COMPARISON */}
      <section
        className="
          grid
          gap-[var(--space-section)]

          lg:grid-cols-2
        "
      >
        <CodeEditorCard
          label="Before"
          tone="danger"
          value={
            value.beforeCode
          }
          placeholder="Paste the previous code here..."
          onChange={(next) =>
            set(
              "beforeCode",
              next,
            )
          }
        />

        <CodeEditorCard
          label="After"
          tone="success"
          value={
            value.afterCode
          }
          placeholder="Paste the improved code here..."
          onChange={(next) =>
            set(
              "afterCode",
              next,
            )
          }
        />
      </section>

      {/* REASON / IMPACT */}
      <section
        className="
          grid
          gap-[var(--space-section-small)]
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-[var(--space-card)]

          lg:grid-cols-2
        "
      >
        <div>
          <Label>
            Reason
          </Label>

          <Textarea
            value={
              value.reason
            }
            onChange={(event) =>
              set(
                "reason",
                event.target.value,
              )
            }
            placeholder="Why was this change necessary?"
            required
          />
        </div>

        <div>
          <Label>
            Impact
          </Label>

          <Textarea
            value={
              value.impact ?? ""
            }
            onChange={(event) =>
              set(
                "impact",
                event.target.value,
              )
            }
            placeholder="What behavior, risk, or performance does this affect?"
          />
        </div>
      </section>

      {/* ERROR */}
      {error ? (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-[var(--space-quick-action-y)]
            text-sm
            text-red-700

            dark:border-red-900/50
            dark:bg-red-950/20
            dark:text-red-300
          "
        >
          {error}
        </div>
      ) : null}

      {/* ACTIONS */}
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          pt-1
        "
      >
        <Link
          href={
            id
              ? `/snippets/${id}`
              : "/snippets"
          }
          className="
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

          Cancel
        </Link>

        <Button
          disabled={loading}
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {id
            ? "Save changes"
            : "Create snippet"}
        </Button>
      </div>
    </form>
  );
}

function CodeEditorCard({
  label,
  tone,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  tone:
    | "danger"
    | "success";
  value: string;
  placeholder: string;
  onChange: (
    value: string,
  ) => void;
}) {
  return (
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
          flex
          items-center
          gap-2
          border-b
          border-[var(--border)]
          px-[var(--space-card)]
          py-[var(--space-header-y)]
        "
      >
        <span
          className={`
            h-2
            w-2
            rounded-full

            ${
              tone ===
              "danger"
                ? "bg-red-400"
                : "bg-emerald-400"
            }
          `}
        />

        <div
          className={`
            text-xs
            font-semibold
            uppercase
            tracking-[.15em]

            ${
              tone ===
              "danger"
                ? "text-[var(--danger)]"
                : "text-[var(--success)]"
            }
          `}
        >
          {label}
        </div>
      </div>

      <textarea
        className="
          field
          min-h-[330px]
          w-full
          resize-y
          rounded-none
          border-0
          px-[var(--space-card)]
          py-[var(--space-card)]
          font-mono
          text-[13px]
          leading-6
          outline-none
        "
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
      />
    </div>
  );
}