import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
import { getOwnProfile } from "@/server/profile/profile.service";
import { getUserSettings } from "@/server/settings/settings.service";
import { serializeForClient } from "@/server/shared/serialize";

import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/login");
  }

  const [profile, settings] = await Promise.all([
    getOwnProfile(session.id),
    getUserSettings(session.id),
  ]);

  return (
    <SettingsClient
      initialUser={serializeForClient({
        id: profile.id,
        name: profile.name,
        email: settings.account.email,
        role: settings.account.role,
        bio: profile.bio,
      })}
      initialPreferences={serializeForClient(
        settings.preferences,
      )}
    />
  );
}