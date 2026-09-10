"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import Link from "next/link";
import { Button, Input, Label, Textarea } from "@/components/ui";
import { CATEGORY_LABEL, CATEGORY_OPTIONS } from "@/lib/constants";

export type SnippetFormValue = {
  ticketNo: string;
  title: string;
  description?: string | null;
  reason: string;
  impact?: string | null;
  language: string;
  framework?: string | null;
  category: (typeof CATEGORY_OPTIONS)[number];
  beforeCode: string;
  afterCode: string;
};

const empty: SnippetFormValue = {
  ticketNo: "",
  title: "",
  description: "",
  reason: "",
  impact: "",
  language: "TypeScript",
  framework: "Next.js",
  category: "GENERAL",
  beforeCode: "",
  afterCode: "",
};

export function SnippetForm({ initial, id }: { initial?: SnippetFormValue; id?: string }) {
  const router = useRouter();
  const [value, setValue] = useState<SnippetFormValue>(initial ?? empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (key: keyof SnippetFormValue, next: string) => setValue((current) => ({ ...current, [key]: next }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch(id ? `/api/snippets/${id}` : "/api/snippets", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to save snippet.");
      setLoading(false);
      return;
    }
    router.push(`/snippets/${data.snippet.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 md:grid-cols-2">
        <div><Label>Ticket number</Label><Input value={value.ticketNo} onChange={(e) => set("ticketNo", e.target.value)} placeholder="DEV-1024" required /></div>
        <div><Label>Title</Label><Input value={value.title} onChange={(e) => set("title", e.target.value)} placeholder="Fix permission guard on task endpoint" required /></div>
        <div><Label>Language</Label><Input value={value.language} onChange={(e) => set("language", e.target.value)} placeholder="Java" required /></div>
        <div><Label>Framework</Label><Input value={value.framework ?? ""} onChange={(e) => set("framework", e.target.value)} placeholder="Quarkus" /></div>
        <div><Label>Category</Label><select className="field h-11 px-3.5 text-sm" value={value.category} onChange={(e) => set("category", e.target.value)}>{CATEGORY_OPTIONS.map((item) => <option key={item} value={item}>{CATEGORY_LABEL[item]}</option>)}</select></div>
        <div><Label>Short description</Label><Input value={value.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="What changed in one sentence" /></div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="mb-3 text-xs font-semibold uppercase tracking-[.15em] text-[var(--danger)]">Before</div><textarea className="field min-h-[330px] resize-y px-4 py-3 font-mono text-[13px] leading-6" value={value.beforeCode} onChange={(e) => set("beforeCode", e.target.value)} placeholder="Paste the previous code here..." /></div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"><div className="mb-3 text-xs font-semibold uppercase tracking-[.15em] text-[var(--success)]">After</div><textarea className="field min-h-[330px] resize-y px-4 py-3 font-mono text-[13px] leading-6" value={value.afterCode} onChange={(e) => set("afterCode", e.target.value)} placeholder="Paste the improved code here..." /></div>
      </div>
      <div className="grid gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 lg:grid-cols-2">
        <div><Label>Reason</Label><Textarea value={value.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Why was this change necessary?" required /></div>
        <div><Label>Impact</Label><Textarea value={value.impact ?? ""} onChange={(e) => set("impact", e.target.value)} placeholder="What behavior, risk, or performance does this affect?" /></div>
      </div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{error}</div> : null}
      <div className="flex items-center justify-between"><Link href={id ? `/snippets/${id}` : "/snippets"} className="inline-flex items-center gap-2 text-sm text-[var(--text-soft)] hover:text-[var(--text)]"><ArrowLeft className="h-4 w-4" /> Cancel</Link><Button disabled={loading}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {id ? "Save changes" : "Create snippet"}</Button></div>
    </form>
  );
}
