import {
  notFound,
  redirect,
} from "next/navigation";

import {
  getServerSession,
} from "@/lib/auth";

import {
  getGroup,
  getGroupMessages,
} from "@/server/messages/group-chat.service";

import GroupChatClient from "./group-chat-client";

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const { id } =
    await params;

  try {
    const [
      groupData,
      messages,
    ] =
      await Promise.all([
        getGroup(
          id,
          user.id,
        ),

        getGroupMessages(
          id,
          user.id,
        ),
      ]);

    return (
      <GroupChatClient
        initialData={{
          ...groupData,

          group: {
            ...groupData.group,

            createdAt:
              groupData.group.createdAt.toISOString(),

            updatedAt:
              groupData.group.updatedAt.toISOString(),

            members:
              groupData.group.members.map(
                (
                  member,
                ) => ({
                  ...member,

                  joinedAt:
                    member.joinedAt.toISOString(),
                }),
              ),
          },
        }}
        initialMessages={messages.map(
          (message) => ({
            ...message,

            createdAt:
              message.createdAt.toISOString(),

            updatedAt:
              message.updatedAt.toISOString(),
          }),
        )}
      />
    );
  } catch {
    notFound();
  }
}