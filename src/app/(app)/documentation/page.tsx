"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpenText, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge, EmptyState, Input, Spinner } from "@/components/ui";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "@/lib/constants";
import { formatDate } from "@/lib/format";

type Doc = { id: string; title: string; excerpt?: string; language: string; category: keyof typeof CATEGORY_LABEL; tags: string[]; isPublished: boolean; updatedAt: string; author: { name: string } };

export default function DocumentationPage() {
  const [items, setItems] = useState<Doc[] | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  useEffect(() => { fetch("/api/documentation").then((r) => r.json()).then((d) => setItems(d.documents ?? [])); }, []);
  const filtered = useMemo(() => (items ?? []).filter((item) => {
    const q = search.toLowerCase();
    return (!q || `${item.title} ${item.excerpt ?? ""} ${item.language} ${item.tags.join(" ")}`.toLowerCase().includes(q)) && (!category || item.category === category) && (!language || item.language === language);
  }), [items, search, category, language]);

  return <div>
    <PageHeader eyebrow="Knowledge" title="Documentation" description="A calm, searchable home for implementation notes, technical guides, and team conventions." action={<Link href="/documentation/new" className="inline-flex items-center gap-2 rounded-xl bg-[var(--text)] px-4 py-2.5 text-sm font-medium text-[var(--surface)]"><Plus className="h-4 w-4"/> New document</Link>} />
    <div className="mb-5 flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"/><Input className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documentation..." /></div><select className="field h-11 px-3.5 text-sm md:w-48" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}</select><select className="field h-11 px-3.5 text-sm md:w-48" value={language} onChange={(e) => setLanguage(e.target.value)}><option value="">All languages</option>{Array.from(new Set((items ?? []).map((item) => item.language))).sort().map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
    {!items ? <Spinner/> : filtered.length === 0 ? <EmptyState title="No documentation found" description="Write the first guide or change the current filters." action={<Link href="/documentation/new" className="text-sm font-medium text-[var(--primary)]">Create document</Link>} /> : <div className="grid gap-4 lg:grid-cols-2">{filtered.map((item) => <Link href={`/documentation/${item.id}`} key={item.id} className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow)]"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><BookOpenText className="h-[18px] w-[18px]"/></span><ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition group-hover:translate-x-1"/></div><div className="mt-5 flex flex-wrap gap-2"><Badge>{CATEGORY_LABEL[item.category]}</Badge><Badge>{item.language}</Badge>{!item.isPublished ? <Badge tone="warning">Draft</Badge> : null}</div><h2 className="mt-3 text-base font-semibold tracking-[-0.015em]">{item.title}</h2><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-6 text-[var(--text-soft)]">{item.excerpt || "No excerpt provided."}</p><div className="mt-4 text-xs text-[var(--text-muted)]">{item.author.name} · {formatDate(item.updatedAt)}</div></Link>)}</div>}
  </div>;
}
