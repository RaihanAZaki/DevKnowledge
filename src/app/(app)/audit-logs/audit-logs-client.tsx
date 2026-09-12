"use client";

import {
  Check,
  ChevronDown,
  FileText,
  Layers3,
  ListFilter,
  RefreshCcw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Badge,
  Spinner,
} from "@/components/ui";

import {
  formatDate,
} from "@/lib/format";

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string;
  createdAt: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

type AuditResponse = {
  logs: AuditLog[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const ACTION_OPTIONS = [
  {
    value: "CREATE",
    label: "Create",
  },
  {
    value: "UPDATE",
    label: "Update",
  },
  {
    value: "DELETE",
    label: "Delete",
  },
];

const ENTITY_OPTIONS = [
  {
    value: "SNIPPET",
    label: "Code Snippet",
  },
  {
    value: "DOCUMENTATION",
    label: "Documentation",
  },
  {
    value: "FORUM",
    label: "Forum",
  },
];

function actionTone(
  action: string,
):
  | "neutral"
  | "success"
  | "warning"
  | "danger" {
  switch (action) {
    case "CREATE":
      return "success";

    case "UPDATE":
      return "warning";

    case "DELETE":
      return "danger";

    default:
      return "neutral";
  }
}

export default function AuditLogsClient({
  initialData,
}: {
  initialData: AuditResponse;
}) {
  const [data, setData] =
    useState<AuditResponse | null>(
      initialData,
    );

  const [search, setSearch] =
    useState("");

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [action, setAction] =
    useState("");

  const [actionOpen, setActionOpen] =
    useState(false);

  const [entity, setEntity] =
    useState("");

  const [entityOpen, setEntityOpen] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [loading, setLoading] =
    useState(false);

  const firstRun =
    useRef(true);

  const hasFilter =
    search.trim().length > 0 ||
    action.length > 0 ||
    entity.length > 0;

  const loadLogs =
    useCallback(async () => {
      try {
        setLoading(true);

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.set(
            "search",
            search.trim(),
          );
        }

        if (action) {
          params.set(
            "action",
            action,
          );
        }

        if (entity) {
          params.set(
            "entity",
            entity,
          );
        }

        params.set(
          "page",
          String(page),
        );

        params.set(
          "limit",
          "20",
        );

        const response =
          await fetch(
            `/api/audit-logs?${params.toString()}`,
            {
              cache: "no-store",
            },
          );

        if (
          response.status === 401
        ) {
          window.location.href =
            "/login";

          return;
        }

        if (!response.ok) {
          const text =
            await response.text();

          console.error(
            "AUDIT LOG API ERROR",
            {
              status:
                response.status,

              statusText:
                response.statusText,

              body: text,
            },
          );

          throw new Error(
            `Audit Log API ${response.status}: ${
              text ||
              response.statusText
            }`,
          );
        }

        const result =
          (await response.json()) as AuditResponse;

        setData(result);
      } catch (error) {
        console.error(
          error,
        );
      } finally {
        setLoading(false);
      }
    }, [
      search,
      action,
      entity,
      page,
    ]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;

      return;
    }

    const timer =
      window.setTimeout(
        () => {
          void loadLogs();
        },
        300,
      );

    return () =>
      window.clearTimeout(
        timer,
      );
  }, [loadLogs]);

  function resetFilters() {
    setSearch("");
    setAction("");
    setEntity("");
    setPage(1);

    setSearchOpen(false);
    setActionOpen(false);
    setEntityOpen(false);
  }

  function selectAction(
    value: string,
  ) {
    setAction(
      action === value
        ? ""
        : value,
    );

    setPage(1);
    setActionOpen(false);
  }

  function selectEntity(
    value: string,
  ) {
    setEntity(
      entity === value
        ? ""
        : value,
    );

    setPage(1);
    setEntityOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div
            className="
              mb-2
              flex
              items-center
              gap-2
              text-xs
              font-medium
              uppercase
              tracking-[0.16em]
              text-[var(--text-muted)]
            "
          >
            <ShieldCheck className="h-4 w-4" />

            Governance
          </div>

          <h1
            className="
              text-2xl
              font-semibold
              tracking-[-0.03em]
            "
          >
            Audit Log
          </h1>

          <p
            className="
              mt-2
              max-w-2xl
              text-sm
              leading-6
              text-[var(--text-soft)]
            "
          >
            Review changes performed
            across snippets,
            documentation, and team
            discussions.
          </p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() =>
            void loadLogs()
          }
          className="
            inline-flex
            h-10
            items-center
            justify-center
            gap-2
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-4
            text-sm
            font-medium
            transition
            hover:bg-[var(--surface-hover)]
            disabled:opacity-50
          "
        >
          <RefreshCcw
            className={`h-4 w-4 ${
              loading
                ? "animate-spin"
                : ""
            }`}
          />

          Refresh
        </button>
      </div>

      {/* FILTER */}

      <div
        className="
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
            flex-wrap
            items-center
            justify-end
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
              onClick={() => {
                setSearchOpen(
                  true,
                );

                setActionOpen(
                  false,
                );

                setEntityOpen(
                  false,
                );
              }}
              className="
                grid
                h-10
                w-10
                shrink-0
                place-items-center
                text-[var(--text-muted)]
              "
            >
              <Search className="h-4 w-4" />
            </button>

            {searchOpen && (
              <>
                <input
                  autoFocus
                  value={
                    search
                  }
                  onChange={(
                    event,
                  ) => {
                    setSearch(
                      event
                        .target
                        .value,
                    );

                    setPage(
                      1,
                    );
                  }}
                  placeholder="Search audit logs..."
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
                    setSearch(
                      "",
                    );

                    setSearchOpen(
                      false,
                    );

                    setPage(
                      1,
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

          {/* ACTION */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setActionOpen(
                  (previous) =>
                    !previous,
                );

                setEntityOpen(
                  false,
                );

                setSearchOpen(
                  false,
                );
              }}
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
                  actionOpen ||
                  action
                    ? "border-[var(--primary)]"
                    : "border-[var(--border)]"
                }
              `}
            >
              <ListFilter className="h-4 w-4" />

              {action && (
                <span
                  className="
                    hidden
                    text-xs
                    font-medium
                    sm:inline
                  "
                >
                  {
                    ACTION_OPTIONS.find(
                      (item) =>
                        item.value ===
                        action,
                    )?.label
                  }
                </span>
              )}

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform

                  ${
                    actionOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {actionOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-11
                  z-30
                  w-36
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  p-1.5
                  shadow-xl
                "
              >
                {ACTION_OPTIONS.map(
                  (item) => {
                    const selected =
                      action ===
                      item.value;

                    return (
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        onClick={() =>
                          selectAction(
                            item.value,
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-2.5
                          rounded-lg
                          px-2
                          py-1.5
                          text-left
                          transition
                          hover:bg-[var(--surface-soft)]
                        "
                      >
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

                        <span className="text-[13px] text-[var(--text-soft)]">
                          {
                            item.label
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* ENTITY */}

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setEntityOpen(
                  (previous) =>
                    !previous,
                );

                setActionOpen(
                  false,
                );

                setSearchOpen(
                  false,
                );
              }}
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
                  entityOpen ||
                  entity
                    ? "border-[var(--primary)]"
                    : "border-[var(--border)]"
                }
              `}
            >
              <Layers3 className="h-4 w-4" />

              {entity && (
                <span
                  className="
                    hidden
                    text-xs
                    font-medium
                    sm:inline
                  "
                >
                  {
                    ENTITY_OPTIONS.find(
                      (item) =>
                        item.value ===
                        entity,
                    )?.label
                  }
                </span>
              )}

              <ChevronDown
                className={`
                  h-4
                  w-4
                  transition-transform

                  ${
                    entityOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {entityOpen && (
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
                {ENTITY_OPTIONS.map(
                  (item) => {
                    const selected =
                      entity ===
                      item.value;

                    return (
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        onClick={() =>
                          selectEntity(
                            item.value,
                          )
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-2.5
                          rounded-lg
                          px-2
                          py-1.5
                          text-left
                          transition
                          hover:bg-[var(--surface-soft)]
                        "
                      >
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

                        <span className="text-[13px] text-[var(--text-soft)]">
                          {
                            item.label
                          }
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          {/* RESET */}

          {hasFilter && (
            <button
              type="button"
              onClick={
                resetFilters
              }
              title="Reset filters"
              className="
                grid
                h-10
                w-10
                place-items-center
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                text-[var(--text-muted)]
                transition
                hover:bg-[var(--surface-hover)]
                hover:text-[var(--text)]
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
        "
      >
        {loading && !data ? (
          <Spinner label="Loading audit logs" />
        ) : null}

        {!loading &&
        data &&
        data.logs.length === 0 ? (
          <div
            className="
              flex
              min-h-64
              flex-col
              items-center
              justify-center
              px-6
              text-center
            "
          >
            <div
              className="
                grid
                h-12
                w-12
                place-items-center
                rounded-2xl
                bg-[var(--surface-soft)]
              "
            >
              <FileText className="h-5 w-5 text-[var(--text-muted)]" />
            </div>

            <h2 className="mt-4 text-sm font-semibold">
              No audit logs found
            </h2>

            <p
              className="
                mt-1
                max-w-md
                text-sm
                text-[var(--text-muted)]
              "
            >
              Activity will appear
              here after you create,
              update, or delete
              knowledge.
            </p>
          </div>
        ) : null}

        {data &&
        data.logs.length >
          0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr
                    className="
                      border-b
                      border-[var(--border)]
                      bg-[var(--surface-soft)]
                      text-left
                    "
                  >
                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      User
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Action
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Entity
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Description
                    </th>

                    <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[var(--border)]">
                  {data.logs.map(
                    (log) => (
                      <tr
                        key={
                          log.id
                        }
                        className="
                          transition
                          hover:bg-[var(--surface-soft)]
                        "
                      >
                        <td className="px-5 py-4 align-top">
                          <div className="text-sm font-medium">
                            {
                              log
                                .user
                                .name
                            }
                          </div>

                          <div className="mt-1 text-xs text-[var(--text-muted)]">
                            {
                              log
                                .user
                                .email
                            }
                          </div>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <Badge
                            tone={actionTone(
                              log.action,
                            )}
                          >
                            {
                              log.action
                            }
                          </Badge>
                        </td>

                        <td className="px-5 py-4 align-top">
                          <div className="text-xs font-medium text-[var(--text-soft)]">
                            {
                              log.entity
                            }
                          </div>
                        </td>

                        <td className="max-w-md px-5 py-4 align-top">
                          <div className="text-sm leading-6">
                            {
                              log.description
                            }
                          </div>

                          {log.entityId ? (
                            <div
                              className="
                                mt-1
                                truncate
                                font-mono
                                text-[10px]
                                text-[var(--text-muted)]
                              "
                            >
                              ID:{" "}
                              {
                                log.entityId
                              }
                            </div>
                          ) : null}
                        </td>

                        <td
                          className="
                            whitespace-nowrap
                            px-5
                            py-4
                            align-top
                            text-xs
                            text-[var(--text-muted)]
                          "
                        >
                          {formatDate(
                            log.createdAt,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div
              className="
                flex
                items-center
                justify-between
                border-t
                border-[var(--border)]
                px-5
                py-4
              "
            >
              <div className="text-xs text-[var(--text-muted)]">
                {
                  data
                    .pagination
                    .total
                }{" "}
                audit logs
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    data
                      .pagination
                      .page <=
                    1
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        Math.max(
                          current -
                            1,
                          1,
                        ),
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    px-3
                    py-1.5
                    text-xs
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>

                <span className="px-2 text-xs text-[var(--text-muted)]">
                  {
                    data
                      .pagination
                      .page
                  }{" "}
                  /{" "}
                  {Math.max(
                    data
                      .pagination
                      .totalPages,
                    1,
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    data
                      .pagination
                      .page >=
                    data
                      .pagination
                      .totalPages
                  }
                  onClick={() =>
                    setPage(
                      (
                        current,
                      ) =>
                        current +
                        1,
                    )
                  }
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    px-3
                    py-1.5
                    text-xs
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}