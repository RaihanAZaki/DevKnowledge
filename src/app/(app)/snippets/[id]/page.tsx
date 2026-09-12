import { redirect, notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getSnippetById } from "@/server/snippets/snippet.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";
import SnippetDetailClient from "./snippet-detail-client";

export default async function SnippetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const data = await getSnippetById(id, user);
    return <SnippetDetailClient id={id} initialData={serializeForClient(data)} />;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
