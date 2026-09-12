import { redirect, notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SnippetForm } from "@/components/snippet-form";
import { getServerSession } from "@/lib/auth";
import { getSnippetById } from "@/server/snippets/snippet.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";

export default async function EditSnippetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const data = await getSnippetById(id, user);
    if (!data.canManage) redirect(`/snippets/${id}`);
    return <div><PageHeader eyebrow="Code Snippets" title="Edit snippet" description="Update the code comparison and keep the reason accurate."/><SnippetForm id={id} initial={serializeForClient(data.snippet)} /></div>;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
