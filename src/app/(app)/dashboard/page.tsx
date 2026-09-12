"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpenText, Braces, MessageSquareText, Plus, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, Spinner } from "@/components/ui";
import { formatDate } from "@/lib/format";

type Data = {
  user: { name: string };
  stats: { snippets: number; documents: number; threads: number };
  recent: Array<{ id: string; title: string; type: "snippet" | "document" | "forum"; meta: string; updatedAt: string }>;
};

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => { fetch("/api/dashboard").then((r) => r.json()).then(setData); }, []);
  if (!data) return <Spinner label="Preparing your workspace" />;

  const firstName = data.user.name.split(" ")[0];
  const cards = [
    { label: "Code Snippets", value: data.stats.snippets, icon: Braces, href: "/snippets", note: "Before & after changes" },
    { label: "Documentation", value: data.stats.documents, icon: BookOpenText, href: "/documentation", note: "Published knowledge" },
    { label: "Discussions", value: data.stats.threads, icon: MessageSquareText, href: "/forum", note: "Team conversations" },
  ];

  return (
    <div>
      <PageHeader eyebrow="Overview" title={`Good afternoon, ${firstName}.`} description="Everything your team knows, organized around the context developers actually need."/>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href, note }) => (
          <Link href={href} key={label} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]">
            <div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon className="h-[18px] w-[18px]" /></span><ArrowUpRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:text-[var(--text)]" /></div>
            <div className="mt-6 text-3xl font-semibold tracking-[-0.04em]">{value}</div>
            <div className="mt-1 text-sm font-medium">{label}</div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">{note}</div>
          </Link>
        ))}
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4"><div><h2 className="text-sm font-semibold">Recent knowledge</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Latest updates across the workspace</p></div></div>
          <div className="divide-y divide-[var(--border)]">
            {data.recent.length === 0 ? <div className="p-8 text-sm text-[var(--text-muted)]">No knowledge yet.</div> : data.recent.map((item) => {
              const href = item.type === "snippet" ? `/snippets/${item.id}` : item.type === "document" ? `/documentation/${item.id}` : `/forum/${item.id}`;
              return <Link href={href} key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-5 py-4 transition hover:bg-[var(--surface-soft)]"><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{item.title}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{item.meta} · {formatDate(item.updatedAt)}</div></div><Badge>{item.type}</Badge></Link>;
            })}
          </div>
        </section>
        <section className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--primary-soft)] blur-2xl" />
          <div className="relative"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Sparkles className="h-[18px] w-[18px]" /></span><h2 className="mt-5 text-lg font-semibold tracking-[-0.02em]">Turn questions into knowledge.</h2><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Ask DevKnowledge AI about code, architecture, debugging, or documentation.</p><Link href="/ai" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">Open AI Chat <ArrowUpRight className="h-4 w-4" /></Link></div>
        </section>
      </div>
    </div>
  );
}
