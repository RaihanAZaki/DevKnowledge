"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Braces, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, Input, Spinner } from "@/components/ui";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type Snippet = { id: string; ticketNo: string; title: string; description?: string; language: string; framework?: string; category: keyof typeof CATEGORY_LABEL; updatedAt: string; author: { name: string } };

export default function SnippetsPage() {
  const [items, setItems] = useState<Snippet[] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  useEffect(() => { fetch("/api/snippets").then((r) => r.json()).then((d) => setItems(d.snippets ?? [])); }, []);
  const filtered = useMemo(() => (items ?? []).filter((item) => {
    const q = search.toLowerCase();
    return (!q || `${item.ticketNo} ${item.title} ${item.description ?? ""}`.toLowerCase().includes(q)) && (!category || item.category === category);
  }), [items, search, category]);

  return <div>
    <PageHeader eyebrow="Knowledge" title="Code Snippets" description="Capture before-and-after code together with the ticket, reason, and impact behind the change." action={<Link href="/snippets/new" className="inline-flex items-center gap-2 rounded-xl bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--surface)]"><Plus className="h-4 w-4" /> New snippet</Link>} />
    <div className="mb-5 flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" /><Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ticket, title, or reason..." /></div><select className="field h-11 max-w-full px-3.5 text-sm md:w-48" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}</select></div>
    {!items ? <Spinner /> : filtered.length === 0 ? <EmptyState title="No snippets found" description="Create the first before-and-after code entry, or adjust your filters." action={<Link href="/snippets/new" className="text-sm font-medium text-[var(--primary)]">Create snippet</Link>} /> : <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"><div className="divide-y divide-[var(--border)]">{filtered.map((item) => <Link href={`/snippets/${item.id}`} key={item.id} className="group flex gap-4 px-5 py-5 transition hover:bg-[var(--surface-soft)]"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Braces className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-[var(--primary)]">{item.ticketNo}</span><Badge>{CATEGORY_LABEL[item.category]}</Badge></div><h2 className="mt-2 font-medium tracking-[-0.01em]">{item.title}</h2>{item.description ? <p className="mt-1 line-clamp-1 text-sm text-[var(--text-soft)]">{item.description}</p> : null}<div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]"><span>{item.language}{item.framework ? ` · ${item.framework}` : ""}</span><span>by {item.author.name}</span><span>{formatDate(item.updatedAt)}</span></div></div><ArrowRight className="mt-2 h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1 group-hover:text-[var(--text)]" /></Link>)}</div></div>}
  </div>;
}
