import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getFriendOverview } from "@/server/friends/friend.service";
import { serializeForClient } from "@/server/shared/serialize";
import FriendsClient from "./friends-client";

export default async function FriendsPage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const data = await getFriendOverview(user.id);
  return <FriendsClient initialData={serializeForClient(data)} />;
}
