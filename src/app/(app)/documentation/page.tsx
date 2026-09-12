import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { listDocuments } from "@/server/documentation/document.service";
import { serializeForClient } from "@/server/shared/serialize";
import DocumentationClient from "./documentation-client";

export default async function DocumentationPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const documents = await listDocuments({ userId: user.id, scope: "mine" });
  return <DocumentationClient initialItems={serializeForClient(documents)} />;
}
