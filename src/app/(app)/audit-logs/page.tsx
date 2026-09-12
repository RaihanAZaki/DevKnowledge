import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { listAuditLogs } from "@/server/audit/audit.service";
import { serializeForClient } from "@/server/shared/serialize";
import AuditLogsClient from "./audit-logs-client";

export default async function AuditLogPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const data = await listAuditLogs({ page: 1, limit: 20 });
  return <AuditLogsClient initialData={serializeForClient(data)} />;
}
