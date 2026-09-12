import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";

import {
  listAuditLogs,
} from "@/server/audit/audit.service";

import AuditLogsClient from "./audit-logs-client";

export default async function AuditLogsPage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const initialData =
    await listAuditLogs(
      user,
      {
        search: "",
        action: "",
        entity: "",
        page: 1,
        limit: 20,
      },
    );

  const serializedData = {
    ...initialData,

    logs:
      initialData.logs.map(
        (log) => ({
          ...log,

          createdAt:
            log.createdAt.toISOString(),
        }),
      ),
  };

  return (
    <AuditLogsClient
      initialData={
        serializedData
      }
    />
  );
}