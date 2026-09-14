import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth";
import { getUserSettings } from "@/server/settings/settings.service";
import { serializeForClient } from "@/server/shared/serialize";

import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const user =
    await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const data =
    await getUserSettings(
      user.id,
    );

  return (
    <SettingsClient
      initialData={
        serializeForClient(
          data,
        )
      }
    />
  );
}