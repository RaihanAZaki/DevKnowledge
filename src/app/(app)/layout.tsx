import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import PreferenceSync from "@/components/preference-sync";

import { getServerSession } from "@/lib/auth";
import { getUserSettings } from "@/server/settings/settings.service";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const settings = await getUserSettings(
    user.id,
  );

  return (
    <>
      <PreferenceSync
        initialPreferences={{
          theme:
            settings.preferences.theme,
          compactMode:
            settings.preferences
              .compactMode,
        }}
      />

      <AppShell
        initialUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }}
      >
        {children}
      </AppShell>
    </>
  );
}