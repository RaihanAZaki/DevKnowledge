import { redirect, notFound } from "next/navigation";
import { DocumentForm } from "@/components/document-form";
import { PageHeader } from "@/components/page-header";
import { getServerSession } from "@/lib/auth";
import { getDocumentById } from "@/server/documentation/document.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const data = await getDocumentById(id, user);
    if (!data.canManage) redirect(`/documentation/${id}`);
    return <div><PageHeader eyebrow="Documentation" title="Edit document" description="Keep the guide accurate and useful for the next developer."/><DocumentForm id={id} initial={serializeForClient(data.document)} /></div>;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    if (error instanceof AppError && error.status === 403) redirect("/documentation");
    throw error;
  }
}
