"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FileText,
  RefreshCcw,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Badge, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/format";

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

function actionTone(
  action: string
): "neutral" | "success" | "warning" | "danger" {
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

export default function AuditLogPage() {
  const [data, setData] =
    useState<AuditResponse | null>(null);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (action) {
        params.set("action", action);
      }

      if (entity) {
        params.set("entity", entity);
      }

      params.set("page", String(page));
      params.set("limit", "20");

     const response = await fetch(
        `/api/audit-logs?${params.toString()}`
        );

      if (response.status === 401) {
        window.location.href = "/login";
        return;
      }

    if (!response.ok) {
  const text = await response.text();

  console.error("AUDIT LOG API ERROR", {
    status: response.status,
    statusText: response.statusText,
    body: text,
  });

  throw new Error(
    `Audit Log API ${response.status}: ${text || response.statusText}`
  );
}

      const result =
        (await response.json()) as AuditResponse;

      setData(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search, action, entity, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadLogs();
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadLogs]);

  function resetFilters() {
    setSearch("");
    setAction("");
    setEntity("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <ShieldCheck className="h-4 w-4" />

            Governance
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.03em]">
            Audit Log
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">
            Review changes performed across snippets,
            documentation, and team discussions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium transition hover:bg-[var(--surface-hover)]"
        >
          <RefreshCcw className="h-4 w-4" />

          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />

            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search audit logs..."
              className="field h-10 w-full pl-9 pr-3 text-sm"
            />
          </div>

          <select
            value={action}
            onChange={(event) => {
                setAction(event.target.value);
                setPage(1);
            }}
            className="field h-10 px-3 text-sm"
            >
            <option value="">All actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
        </select>

          <select
            value={entity}
            onChange={(event) => {
              setEntity(event.target.value);
              setPage(1);
            }}
            className="field h-10 px-3 text-sm"
          >
            <option value="">
              All entities
            </option>

            <option value="SNIPPET">
              Code Snippet
            </option>

            <option value="DOCUMENTATION">
              Documentation
            </option>

            <option value="FORUM">
              Forum
            </option>
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)]"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        {loading && !data ? (
          <Spinner label="Loading audit logs" />
        ) : null}

        {!loading &&
        data &&
        data.logs.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--surface-soft)]">
              <FileText className="h-5 w-5 text-[var(--text-muted)]" />
            </div>

            <h2 className="mt-4 text-sm font-semibold">
              No audit logs found
            </h2>

            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">
              Activity will appear here after users
              create, update, or delete knowledge.
            </p>
          </div>
        ) : null}

        {data && data.logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-left">
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
                  {data.logs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition hover:bg-[var(--surface-soft)]"
                    >
                      <td className="px-5 py-4 align-top">
                        <div className="text-sm font-medium">
                          {log.user.name}
                        </div>

                        <div className="mt-1 text-xs text-[var(--text-muted)]">
                          {log.user.email}
                        </div>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <Badge
                          tone={actionTone(
                            log.action
                          )}
                        >
                          {log.action}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 align-top">
                        <div className="text-xs font-medium text-[var(--text-soft)]">
                          {log.entity}
                        </div>
                      </td>

                      <td className="max-w-md px-5 py-4 align-top">
                        <div className="text-sm leading-6">
                          {log.description}
                        </div>

                        {log.entityId ? (
                          <div className="mt-1 truncate font-mono text-[10px] text-[var(--text-muted)]">
                            ID: {log.entityId}
                          </div>
                        ) : null}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 align-top text-xs text-[var(--text-muted)]">
                        {formatDate(
                          log.createdAt
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-4">
              <div className="text-xs text-[var(--text-muted)]">
                {data.pagination.total} audit logs
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    data.pagination.page <= 1
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        current - 1,
                        1
                      )
                    )
                  }
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="px-2 text-xs text-[var(--text-muted)]">
                  {data.pagination.page} /{" "}
                  {Math.max(
                    data.pagination.totalPages,
                    1
                  )}
                </span>

                <button
                  type="button"
                  disabled={
                    data.pagination.page >=
                    data.pagination.totalPages
                  }
                  onClick={() =>
                    setPage(
                      (current) =>
                        current + 1
                    )
                  }
                  className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-40"
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