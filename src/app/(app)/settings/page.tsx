import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import { getOwnProfile } from "@/server/profile/profile.service";
import { serializeForClient } from "@/server/shared/serialize";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession();
  if (!session) redirect("/login");
  const user = await getOwnProfile(session.id);
  return <SettingsClient initialUser={serializeForClient({ id: user.id, name: user.name, email: user.email, role: user.role, bio: user.bio })} />;
}
