import { redirect, notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getDocumentById } from "@/server/documentation/document.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";
import DocumentDetailClient from "./document-detail-client";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const data = await getDocumentById(id, user);
    return <DocumentDetailClient id={id} initialData={serializeForClient(data)} />;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    if (error instanceof AppError && error.status === 403) redirect("/documentation");
    throw error;
  }
}
