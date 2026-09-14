"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import {
  ArrowLeft,
  LoaderCircle,
  Save,
  Send,
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

export type ForumFormValue = {
  title: string;
  content: string;
  category:
    (typeof CATEGORY_OPTIONS)[number];
  tags: string[];
};

const emptyValue: ForumFormValue = {
  title: "",
  content: "",
  category: "GENERAL",
  tags: [],
};

type ApiResponse = {
  error?: string;

  details?: {
    fieldErrors?: Record<
      string,
      string[]
    >;
  };

  thread?: {
    id: string;
  };
};

export function ForumForm({
  initial,
  id,
}: {
  initial?: ForumFormValue;
  id?: string;
}) {
  const router =
    useRouter();

  const [value, setValue] =
    useState<ForumFormValue>(
      initial ?? emptyValue,
    );

  const [
    tagsInput,
    setTagsInput,
  ] =
    useState(
      (initial?.tags ?? []).join(
        ", ",
      ),
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  function setField<
    K extends keyof ForumFormValue,
  >(
    key: K,
    next: ForumFormValue[K],
  ) {
    setValue((current) => ({
      ...current,
      [key]: next,
    }));
  }

  function parseTags(
    input: string,
  ) {
    return Array.from(
      new Set(
        input
          .split(",")
          .map((item) =>
            item
              .trim()
              .replace(
                /^#/,
                "",
              )
              .slice(
                0,
                40,
              ),
          )
          .filter(Boolean),
      ),
    ).slice(0, 8);
  }

  function getErrorMessage(
    data: ApiResponse | null,
  ) {
    const fieldErrors =
      data?.details
        ?.fieldErrors;

    if (fieldErrors) {
      const messages =
        Object.entries(
          fieldErrors,
        ).flatMap(
          ([
            field,
            errors,
          ]) =>
            errors.map(
              (message) =>
                `${field}: ${message}`,
            ),
        );

      if (
        messages.length >
        0
      ) {
        return messages.join(
          " • ",
        );
      }
    }

    return (
      data?.error ??
      "Unable to save discussion."
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const title =
      value.title.trim();

    const content =
      value.content.trim();

    if (
      title.length < 5
    ) {
      setError(
        "Title must be at least 5 characters.",
      );

      return;
    }

    if (
      content.length < 5
    ) {
      setError(
        "Discussion must be at least 5 characters.",
      );

      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = {
        title,

        content,

        category:
          value.category,

        tags:
          parseTags(
            tagsInput,
          ),
      };

      const response =
        await fetch(
          id
            ? `/api/forum/${id}`
            : "/api/forum",
          {
            method:
              id
                ? "PUT"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );

      const text =
        await response.text();

      let data:
        | ApiResponse
        | null =
        null;

      if (text.trim()) {
        try {
          data =
            JSON.parse(
              text,
            ) as ApiResponse;
        } catch {
          data = null;
        }
      }

      if (
        !response.ok
      ) {
        console.error(
          "FORUM SAVE ERROR:",
          {
            status:
              response.status,
            data,
          },
        );

        setError(
          getErrorMessage(
            data,
          ),
        );

        return;
      }

      if (
        !data?.thread?.id
      ) {
        setError(
          "Discussion was saved, but the server returned an invalid response.",
        );

        return;
      }

      router.push(
        `/forum/${data.thread.id}`,
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SAVE FORUM ERROR:",
        error,
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save discussion.",
      );
    } finally {
      setLoading(false);
    }
  }

  const parsedTags =
    parseTags(
      tagsInput,
    );

  return (
    <form
      onSubmit={submit}
      className="
        space-y-[var(--space-section)]
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-[var(--space-card)]
      "
    >
      {/* TITLE */}

      <div>
        <Label>
          Title
        </Label>

        <Input
          value={
            value.title
          }
          onChange={(
            event,
          ) =>
            setField(
              "title",
              event.target.value,
            )
          }
          placeholder="What is the best way to..."
          minLength={5}
          maxLength={180}
          required
        />

        <div
          className="
            mt-1.5
            flex
            justify-between
            gap-3
            text-xs
            text-[var(--text-muted)]
          "
        >
          <span>
            Minimum 5
            characters.
          </span>

          <span>
            {
              value.title
                .length
            }
            /180
          </span>
        </div>
      </div>

      {/* CATEGORY */}

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
          onChange={(
            event,
          ) =>
            setField(
              "category",
              event.target
                .value as ForumFormValue["category"],
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

      {/* TAGS */}

      <div>
        <Label>
          Tags
        </Label>

        <Input
          value={
            tagsInput
          }
          onChange={(
            event,
          ) =>
            setTagsInput(
              event.target.value,
            )
          }
          placeholder="api, architecture, java"
        />

        <div
          className="
            mt-1.5
            flex
            justify-between
            gap-3
            text-xs
            text-[var(--text-muted)]
          "
        >
          <span>
            Separate tags
            with commas.
            Maximum 8 tags,
            40 characters
            each.
          </span>

          <span>
            {
              parsedTags.length
            }
            /8
          </span>
        </div>

        {parsedTags.length >
          0 && (
          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-2
            "
          >
            {parsedTags.map(
              (tag) => (
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
              ),
            )}
          </div>
        )}
      </div>

      {/* DISCUSSION */}

      <div>
        <Label>
          Discussion
        </Label>

        <Textarea
          value={
            value.content
          }
          onChange={(
            event,
          ) =>
            setField(
              "content",
              event.target.value,
            )
          }
          className="min-h-[260px]"
          placeholder="Describe the problem, what you tried, and what you want to understand..."
          minLength={5}
          maxLength={20000}
          required
        />

        <div
          className="
            mt-1.5
            flex
            justify-between
            gap-3
            text-xs
            text-[var(--text-muted)]
          "
        >
          <span>
            Minimum 5
            characters.
          </span>

          <span>
            {
              value.content
                .length
            }
            /20,000
          </span>
        </div>
      </div>

      {/* ERROR */}

      {error ? (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
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

      {/* ACTION */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <Link
          href={
            id
              ? `/forum/${id}`
              : "/forum"
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
          disabled={
            loading
          }
        >
          {loading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : id ? (
            <Save className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}

          {id
            ? "Save changes"
            : "Publish discussion"}
        </Button>
      </div>
    </form>
  );
}