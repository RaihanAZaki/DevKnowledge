"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Pencil,
  Trash2,
} from "lucide-react";

import {
  Badge,
  GhostButton,
} from "@/components/ui";

import {
  CATEGORY_LABEL,
} from "@/lib/constants";

import {
  formatDate,
} from "@/lib/format";

type Snippet = {
  id: string;
  ticketNo: string;
  title: string;
  description?: string;
  reason: string;
  impact?: string;
  language: string;
  framework?: string;
  category: keyof typeof CATEGORY_LABEL;
  beforeCode: string;
  afterCode: string;
  author: {
    name: string;
  };
  updatedAt: string;
};

export default function SnippetDetailClient({
  id,
  initialData,
}: {
  id: string;

  initialData: {
    snippet: Snippet;
    canManage: boolean;
  };
}) {
  const router =
    useRouter();

  const data =
    initialData;

  async function remove() {
    if (
      !confirm(
        "Delete this snippet permanently?",
      )
    ) {
      return;
    }

    const response =
      await fetch(
        `/api/snippets/${id}`,
        {
          method: "DELETE",
        },
      );

    if (response.ok) {
      router.push(
        "/snippets",
      );

      router.refresh();
    }
  }

  const s =
    data.snippet;

  return (
    <div>
      {/* BACK */}
      <Link
        href="/snippets"
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

        Code Snippets
      </Link>

      {/* HEADER */}
      <div
        className="
          mb-[var(--space-section)]
          flex
          flex-col
          gap-[var(--space-section-small)]

          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div className="min-w-0">
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
                uppercase
                tracking-[.12em]
                text-[var(--primary)]
              "
            >
              {s.ticketNo}
            </span>

            <Badge>
              {
                CATEGORY_LABEL[
                  s.category
                ]
              }
            </Badge>
          </div>

          <h1
            className="
              mt-3
              text-3xl
              font-semibold
              tracking-[-0.04em]
            "
          >
            {s.title}
          </h1>

          {s.description ? (
            <p
              className="
                mt-3
                max-w-3xl
                text-sm
                leading-6
                text-[var(--text-soft)]
              "
            >
              {
                s.description
              }
            </p>
          ) : null}

          <div
            className="
              mt-4
              text-xs
              text-[var(--text-muted)]
            "
          >
            {s.language}

            {s.framework
              ? ` · ${s.framework}`
              : ""}

            {" · "}

            {s.author.name}

            {" · Updated "}

            {formatDate(
              s.updatedAt,
            )}
          </div>
        </div>

        {data.canManage ? (
          <div
            className="
              flex
              shrink-0
              gap-2
            "
          >
            <Link
              href={`/snippets/${id}/edit`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-3.5
                py-[var(--space-quick-action-y)]
                text-sm
                font-medium
                text-[var(--text-soft)]
                transition

                hover:bg-[var(--surface-soft)]
                hover:text-[var(--text)]
              "
            >
              <Pencil className="h-4 w-4" />

              Edit
            </Link>

            <GhostButton
              onClick={remove}
              className="
                text-[var(--danger)]
              "
            >
              <Trash2 className="h-4 w-4" />
            </GhostButton>
          </div>
        ) : null}
      </div>

      {/* CODE COMPARISON */}
      <div
        className="
          grid
          gap-[var(--space-section)]

          xl:grid-cols-2
        "
      >
        <CodeBlock
          label="Before"
          tone="danger"
          code={s.beforeCode}
        />

        <CodeBlock
          label="After"
          tone="success"
          code={s.afterCode}
        />
      </div>

      {/* REASON / IMPACT */}
      <div
        className="
          mt-[var(--space-section)]
          grid
          gap-[var(--space-section)]

          lg:grid-cols-2
        "
      >
        <section
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-[var(--space-card)]
          "
        >
          <h2
            className="
              text-sm
              font-semibold
            "
          >
            Why this changed
          </h2>

          <p
            className="
              mt-3
              whitespace-pre-wrap
              text-sm
              leading-7
              text-[var(--text-soft)]
            "
          >
            {s.reason}
          </p>
        </section>

        <section
          className="
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-[var(--space-card)]
          "
        >
          <h2
            className="
              text-sm
              font-semibold
            "
          >
            Impact
          </h2>

          <p
            className="
              mt-3
              whitespace-pre-wrap
              text-sm
              leading-7
              text-[var(--text-soft)]
            "
          >
            {s.impact ||
              "No impact note was added."}
          </p>
        </section>
      </div>
    </div>
  );
}

function CodeBlock({
  label,
  tone,
  code,
}: {
  label: string;
  tone:
    | "danger"
    | "success";
  code: string;
}) {
  return (
    <section
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

        <span
          className="
            text-xs
            font-semibold
            uppercase
            tracking-[.14em]
            text-[var(--text-muted)]
          "
        >
          {label}
        </span>
      </div>

      <pre
        className="
          min-h-[320px]
          overflow-auto
          bg-[#17191e]
          p-[var(--space-card)]
          text-[13px]
          leading-6
          text-[#e9edf5]
        "
      >
        <code>
          {code ||
            "// No code"}
        </code>
      </pre>
    </section>
  );
}