import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getServerSession } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerSession();
  if (!user) redirect("/login");
  return <AppShell initialUser={{ id: user.id, name: user.name, email: user.email, role: user.role }}>{children}</AppShell>;
}
