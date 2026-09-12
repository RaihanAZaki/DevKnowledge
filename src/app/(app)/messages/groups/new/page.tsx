import {
  redirect,
} from "next/navigation";

import {
  getServerSession,
} from "@/lib/auth";

import {
  getAcceptedFriends,
} from "@/server/messages/group-chat.service";

import NewGroupClient from "./new-group-client";

export default async function NewGroupPage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const friends =
    await getAcceptedFriends(
      user.id,
    );

  return (
    <NewGroupClient
      initialFriends={
        friends
      }
    />
  );
}