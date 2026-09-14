import {
  notFound,
  redirect,
} from "next/navigation";

import {
  ForumForm,
  type ForumFormValue,
} from "@/components/forum-form";

import {
  PageHeader,
} from "@/components/page-header";

import {
  getServerSession,
} from "@/lib/auth";

import {
  getForumThread,
} from "@/server/forum/forum.service";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditForumPage({
  params,
}: PageProps) {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const { id } =
    await params;

  let result;

  try {
    result =
      await getForumThread(
        id,
        user,
      );
  } catch {
    notFound();
  }

  if (!result.canManage) {
    redirect(
      `/forum/${id}`,
    );
  }

  const thread =
    result.thread;

  const initial: ForumFormValue =
    {
      title:
        thread.title,

      content:
        thread.content,

      category:
        thread.category,

      tags:
        thread.tags,
    };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Forum"
        title="Edit discussion"
        description="Update the discussion while keeping its existing replies and accepted solution."
      />

      <ForumForm
        id={thread.id}
        initial={initial}
      />
    </div>
  );
}