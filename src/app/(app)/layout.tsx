import { AppShell } from "@/components/app-shell";
import FloatingAction from "@/components/floating-action";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>
    {children}
    {/* <FloatingAction /> */}
  </AppShell>;
}
