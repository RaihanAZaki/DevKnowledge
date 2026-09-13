import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpenText,
  Bookmark,
  Braces,
  CheckCircle2,
  MessageCircle,
  MessageSquareText,
  Plus,
  Sparkles,
  Trophy,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { getServerSession } from "@/lib/auth";
import { getDashboardData } from "@/server/dashboard/dashboard.service";

export default async function DashboardPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  const data = await getDashboardData(user);

  const firstName = user.name.split(" ")[0];

  const totalUnread =
    data.attention.unreadDirectMessages +
    data.attention.unreadGroupMessages;

  const cards = [
    {
      label: "Code Snippets",
      value: data.stats.snippets,
      mine: data.mine.snippets,
      icon: Braces,
      href: "/snippets",
      note: "Reusable implementation knowledge",
    },
    {
      label: "Documentation",
      value: data.stats.documents,
      mine: data.mine.documents,
      icon: BookOpenText,
      href: "/documentation",
      note: "Knowledge you can access",
    },
    {
      label: "Discussions",
      value: data.stats.threads,
      mine: data.mine.threads,
      icon: MessageSquareText,
      href: "/forum",
      note: "Questions, answers, and solutions",
    },
  ];

  const attentionItems = [
    {
      label: "Unread messages",
      value: totalUnread,
      detail: `${data.attention.unreadDirectMessages} direct · ${data.attention.unreadGroupMessages} group`,
      icon: MessageCircle,
      href: "/dashboard",
    },
    {
      label: "Notifications",
      value: data.attention.unreadNotifications,
      detail: "Updates that need your attention",
      icon: Bell,
      href: "/dashboard",
    },
    {
      label: "Friend requests",
      value: data.attention.pendingFriendRequests,
      detail: "People waiting for your response",
      icon: UserPlus,
      href: "/friends",
    },
    {
      label: "Open discussions",
      value: data.attention.unresolvedThreads,
      detail: "Your threads without an accepted solution",
      icon: CheckCircle2,
      href: "/forum",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}.`}
        description="Your workspace pulse, recent knowledge, and things that need your attention."
      />

      {/* TOP STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(
          ({
            label,
            value,
            mine,
            icon: Icon,
            href,
            note,
          }) => (
            <Link
              href={href}
              key={label}
              prefetch
              className="
                group
                rounded-2xl
                border border-[var(--border)]
                bg-[var(--surface)]
                p-5
                transition
                hover:-translate-y-0.5
                hover:shadow-[var(--shadow)]
              "
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--text)]" />
              </div>

              <div className="mt-6 flex items-end gap-2">
                <div className="text-3xl font-semibold tracking-[-0.04em]">
                  {value}
                </div>

                <div className="pb-1 text-xs text-[var(--text-muted)]">
                  {mine} yours
                </div>
              </div>

              <div className="mt-1 text-sm font-medium">
                {label}
              </div>

              <div className="mt-1 text-xs text-[var(--text-muted)]">
                {note}
              </div>
            </Link>
          ),
        )}
      </div>

      {/* ATTENTION */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {attentionItems.map(
          ({
            label,
            value,
            detail,
            icon: Icon,
            href,
          }) => (
            <Link
              key={label}
              href={href}
              className="
                rounded-2xl
                border border-[var(--border)]
                bg-[var(--surface)]
                p-4
                transition
                hover:bg-[var(--surface-soft)]
              "
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-soft)]">
                  <Icon className="h-4 w-4" />
                </span>

                <span className="text-2xl font-semibold tracking-[-0.03em]">
                  {value}
                </span>
              </div>

              <div className="mt-3 text-sm font-medium">
                {label}
              </div>

              <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                {detail}
              </div>
            </Link>
          ),
        )}
      </div>

      {/* MAIN DASHBOARD */}
      <div className="mt-6 grid items-start gap-x-6 gap-y-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ROW 1 - LEFT */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">
                Recent knowledge
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Latest content you are allowed to access
              </p>
            </div>

            <Link
              href="/documentation"
              className="text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Browse all
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {data.recent.length === 0 ? (
              <div className="p-8 text-sm text-[var(--text-muted)]">
                No knowledge yet.
              </div>
            ) : (
              data.recent.map((item) => {
                const href =
                  item.type === "snippet"
                    ? `/snippets/${item.id}`
                    : item.type === "document"
                      ? `/documentation/${item.id}`
                      : `/forum/${item.id}`;

                return (
                  <Link
                    href={href}
                    prefetch
                    key={`${item.type}-${item.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-soft)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">
                        {item.title}
                      </div>

                      <div className="mt-1 text-xs text-[var(--text-muted)]">
                        {item.meta} · {formatDate(item.updatedAt)}
                      </div>
                    </div>

                    <Badge>
                      {item.type}
                    </Badge>
                  </Link>
                );
              })
            )}
          </div>
        </section>

        {/* ROW 1 - RIGHT */}
        <div className="grid gap-6">
          {/* REPUTATION */}
          <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--primary-soft)] blur-2xl" />

            <div className="relative">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <Trophy className="h-[18px] w-[18px]" />
              </span>

              <div className="mt-4 flex items-end gap-2">
                <span className="text-3xl font-semibold tracking-[-0.04em]">
                  {data.productivity.reputation}
                </span>

                <span className="pb-1 text-xs text-[var(--text-muted)]">
                  reputation
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                +{data.productivity.reputationThisWeek} points in the last 7 days ·{" "}
                {data.productivity.bookmarks} bookmarks saved.
              </p>

              <Link
                href="/profile"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]"
              >
                View profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* QUICK ACTIONS */}
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">
                  Quick actions
                </h2>

                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Keep your knowledge flowing
                </p>
              </div>

              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href="/snippets/new"
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-sm transition hover:bg-[var(--surface-soft)]"
              >
                <Plus className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="truncate">
                  New snippet
                </span>
              </Link>

              <Link
                href="/documentation/new"
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-sm transition hover:bg-[var(--surface-soft)]"
              >
                <BookOpenText className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="truncate">
                  New document
                </span>
              </Link>

              <Link
                href="/forum/new"
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-sm transition hover:bg-[var(--surface-soft)]"
              >
                <MessageSquareText className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="truncate">
                  Discussion
                </span>
              </Link>

              <Link
                href="/ai"
                className="flex min-w-0 items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-3 text-sm transition hover:bg-[var(--surface-soft)]"
              >
                <Sparkles className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                <span className="truncate">
                  Ask AI
                </span>
              </Link>
            </div>
          </section>
        </div>

        {/* ROW 2 - LEFT */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="text-sm font-semibold">
              Recent activity
            </h2>

            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Your latest workspace changes
            </p>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {data.recentActivity.length === 0 ? (
              <div className="p-8 text-sm text-[var(--text-muted)]">
                No recent activity.
              </div>
            ) : (
              data.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-3 px-5 py-4"
                >
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]" />

                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-[var(--text)]">
                      {activity.description}
                    </div>

                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {formatDate(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ROW 2 - RIGHT */}
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">
                Needs a solution
              </h2>

              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Your discussions without an accepted answer
              </p>
            </div>

            <Bookmark className="h-4 w-4 text-[var(--text-muted)]" />
          </div>

          <div className="divide-y divide-[var(--border)]">
            {data.openThreads.length === 0 ? (
              <div className="p-6 text-sm text-[var(--text-muted)]">
                Everything is resolved. Nice work.
              </div>
            ) : (
              data.openThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/forum/${thread.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-soft)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {thread.title}
                    </div>

                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {thread._count.comments} replies ·{" "}
                      {formatDate(thread.updatedAt)}
                    </div>
                  </div>

                  <ArrowUpRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}