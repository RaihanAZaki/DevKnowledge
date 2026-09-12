import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getOwnProfile } from "@/server/profile/profile.service";
import { serializeForClient } from "@/server/shared/serialize";
import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const user = await getServerSession();
  if (!user) redirect("/login");
  const profile = await getOwnProfile(user.id);
  return <ProfileClient initialProfile={serializeForClient(profile)} />;
}
