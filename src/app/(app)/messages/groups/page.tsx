import {
  redirect,
} from "next/navigation";

import {
  getServerSession,
} from "@/lib/auth";

import {
  listUserGroups,
} from "@/server/messages/group-chat.service";

import GroupsClient from "./groups-client";

export default async function GroupsPage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const groups =
    await listUserGroups(
      user.id,
    );

  const initialGroups =
    groups.map(
      (group) => ({
        ...group,

        createdAt:
          group.createdAt.toISOString(),

        updatedAt:
          group.updatedAt.toISOString(),

        members:
          group.members.map(
            (member) => ({
              ...member,

              joinedAt:
                member.joinedAt.toISOString(),
            }),
          ),

        messages:
          group.messages.map(
            (message) => ({
              ...message,

              createdAt:
                message.createdAt.toISOString(),

              updatedAt:
                message.updatedAt.toISOString(),
            }),
          ),
      }),
    );

  return (
    <GroupsClient
      initialGroups={
        initialGroups
      }
    />
  );
}