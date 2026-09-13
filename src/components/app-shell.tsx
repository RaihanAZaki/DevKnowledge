"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BookOpenText,
  Bot,
  Braces,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  Sparkles,
  X,
  ScrollText,
  Users,
} from "lucide-react";

import { initials } from "@/lib/format";
import GlobalSearch from "@/components/global-search";
import ChatWidget from "@/components/chat-widget";
import NotificationBell from "@/components/notification-bell";

const navigation = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    href: "/snippets",
    label: "Code Snippets",
    icon: Braces,
  },
  {
    href: "/documentation",
    label: "Documentation",
    icon: BookOpenText,
  },
  {
    href: "/ai",
    label: "AI Chat",
    icon: Bot,
  },
  {
    href: "/forum",
    label: "Forum",
    icon: MessageSquareText,
  },
  {
    href: "/files",
    label: "My Files",
    icon: Archive,
  },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
  },
  {
    href: "/audit-logs",
    label: "Audit Log",
    icon: ScrollText,
  },
];

type Me = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AppShell({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: Me;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [me] = useState<Me | null>(initialUser);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] =
    useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setMobileSearchOpen(false);
  }, [pathname]);

  const current = useMemo(
    () =>
      navigation.find((item) =>
        pathname.startsWith(item.href),
      ),
    [pathname],
  );

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* LOGO */}
      <div className="flex h-16 items-center px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 font-semibold tracking-[-0.02em]"
        >
          <span
            className="
              grid
              h-8
              w-8
              place-items-center
              rounded-xl
              bg-[var(--text)]
              text-[var(--surface)]
            "
          >
            <Sparkles className="h-4 w-4" />
          </span>

          <span>DevKnowledge</span>
        </Link>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 space-y-1 px-3 py-3">
        <div
          className="
            px-3
            pb-2
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.18em]
            text-[var(--text-muted)]
          "
        >
          Workspace
        </div>

        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                group
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-sm
                transition

                ${
                  active
                    ? `
                      bg-[var(--surface)]
                      text-[var(--text)]
                      shadow-sm
                      ring-1
                      ring-[var(--border)]
                    `
                    : `
                      text-[var(--text-soft)]
                      hover:bg-[var(--surface-hover)]
                      hover:text-[var(--text)]
                    `
                }
              `}
            >
              <Icon
                className={`
                  h-[17px]
                  w-[17px]
                  shrink-0

                  ${
                    active
                      ? "text-[var(--primary)]"
                      : ""
                  }
                `}
              />

              <span className="flex-1">
                {item.label}
              </span>

              {active ? (
                <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* SIDEBAR FOOTER */}
      <div className="border-t border-[var(--border)] p-3">
        <Link
          href="/settings"
          className={`
            mb-2
            flex
            items-center
            gap-3
            rounded-xl
            px-3
            py-2.5
            text-sm
            transition

            ${
              pathname.startsWith("/settings")
                ? `
                  bg-[var(--surface)]
                  shadow-sm
                  ring-1
                  ring-[var(--border)]
                `
                : `
                  text-[var(--text-soft)]
                  hover:bg-[var(--surface-hover)]
                `
            }
          `}
        >
          <Settings className="h-[17px] w-[17px]" />
          Settings
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/profile"
            className={`
              flex
              min-w-0
              flex-1
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              transition

              ${
                pathname.startsWith("/profile")
                  ? `
                    bg-[var(--surface)]
                    shadow-sm
                    ring-1
                    ring-[var(--border)]
                  `
                  : `
                    hover:bg-[var(--surface-hover)]
                  `
              }
            `}
          >
            <div
              className="
                grid
                h-9
                w-9
                shrink-0
                place-items-center
                rounded-full
                bg-[var(--primary-soft)]
                text-xs
                font-semibold
                text-[var(--primary)]
              "
            >
              {me ? initials(me.name) : "DK"}
            </div>

            <div className="min-w-0 flex-1">
              <div
                className="
                  truncate
                  text-sm
                  font-medium
                  text-[var(--text)]
                "
              >
                {me?.name ?? "Loading..."}
              </div>

              <div
                className="
                  truncate
                  text-xs
                  text-[var(--text-muted)]
                "
              >
                {me?.role ?? "Member"}
              </div>
            </div>

            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
          </Link>

          <button
            type="button"
            onClick={logout}
            className="
              shrink-0
              rounded-lg
              p-2
              text-[var(--text-muted)]
              transition
              hover:bg-[var(--surface-hover)]
              hover:text-[var(--danger)]
            "
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* DESKTOP SIDEBAR */}
      <aside
        className="
          fixed
          inset-y-0
          left-0
          z-30
          hidden
          w-[248px]
          border-r
          border-[var(--border)]
          bg-[var(--surface-soft)]
          lg:block
        "
      >
        {sidebar}
      </aside>

      {/* MOBILE SIDEBAR */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            className="
              absolute
              inset-0
              bg-black/30
              backdrop-blur-sm
            "
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          <aside
            className="
              relative
              h-full
              w-[280px]
              max-w-[85vw]
              border-r
              border-[var(--border)]
              bg-[var(--surface-soft)]
              shadow-2xl
            "
          >
            <button
              type="button"
              className="
                absolute
                right-3
                top-3
                z-10
                grid
                h-9
                w-9
                place-items-center
                rounded-lg
                text-[var(--text-muted)]
                transition
                hover:bg-[var(--surface-hover)]
              "
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>

            {sidebar}
          </aside>
        </div>
      ) : null}

      {/* CONTENT */}
      <div className="lg:pl-[248px]">
        {/* HEADER */}
        <header
          className="
            sticky
            top-0
            z-40
            flex
            h-16
            items-center
            gap-2
            border-b
            border-[var(--border)]
            bg-[color-mix(in_srgb,var(--background)_88%,transparent)]
            px-4
            backdrop-blur-xl

            sm:gap-3
            sm:px-6

            lg:px-8
          "
        >
          {/* MOBILE MENU */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="
              grid
              h-10
              w-10
              shrink-0
              place-items-center
              rounded-xl
              text-[var(--text-soft)]
              transition
              hover:bg-[var(--surface-hover)]
              lg:hidden
            "
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* CURRENT PAGE DESKTOP */}
          <div
            className="
              hidden
              text-sm
              font-medium
              text-[var(--text-soft)]
              lg:block
            "
          >
            {current?.label ?? "DevKnowledge"}
          </div>

          {/* HEADER ACTIONS */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <NotificationBell />

            {/* MOBILE SEARCH BUTTON */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="
                grid
                h-10
                w-10
                shrink-0
                place-items-center
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                text-[var(--text-soft)]
                shadow-sm
                transition
                hover:bg-[var(--surface-hover)]
                sm:hidden
              "
              aria-label="Search knowledge"
            >
              <Search className="h-4 w-4" />
            </button>

            {/* DESKTOP SEARCH */}
            <div className="hidden sm:block sm:w-[280px] lg:w-[340px]">
              <GlobalSearch />
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main
          className="
            w-full
            px-4
            py-6

            sm:px-6

            lg:px-8
            lg:py-7
          "
        >
          {children}
        </main>
      </div>

      {/* MOBILE SEARCH OVERLAY */}
      {mobileSearchOpen ? (
        <div
          className="
            fixed
            inset-0
            z-[120]
            bg-black/25
            backdrop-blur-[2px]
            sm:hidden
          "
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
          />

          <div
            className="
              absolute
              left-3
              right-3
              top-[calc(env(safe-area-inset-top)+12px)]
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-2
              shadow-2xl
            "
          >
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <GlobalSearch />
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileSearchOpen(false)
                }
                className="
                  grid
                  h-10
                  w-10
                  shrink-0
                  place-items-center
                  rounded-xl
                  text-[var(--text-muted)]
                  transition
                  hover:bg-[var(--surface-hover)]
                "
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* GLOBAL CHAT */}
      <ChatWidget />
    </div>
  );
}