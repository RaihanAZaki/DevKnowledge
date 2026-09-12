import { redirect, notFound } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getForumThread } from "@/server/forum/forum.service";
import { serializeForClient } from "@/server/shared/serialize";
import { AppError } from "@/server/shared/app-error";
import ForumDetailClient from "./forum-detail-client";

export default async function ForumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const { id } = await params;
  try {
    const data = await getForumThread(id, user);
    return <ForumDetailClient id={id} initialData={serializeForClient(data)} />;
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
