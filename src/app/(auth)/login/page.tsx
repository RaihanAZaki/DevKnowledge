"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ArrowRight, Braces, LoaderCircle, Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }
    router.replace(searchParams.get("next") || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-[var(--space-section-small)]">
      <div><Label>Email</Label><Input name="email" type="email" placeholder="you@company.com" required autoComplete="email" /></div>
      <div><Label>Password</Label><Input name="password" type="password" placeholder="Minimum 8 characters" required autoComplete="current-password" /></div>
      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-[var(--space-row-y)] text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{error}</div> : null}
      <Button className="w-full" disabled={loading}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Sign in <ArrowRight className="h-4 w-4" /></Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden border-r border-[var(--border)] bg-[var(--surface-soft)] p-12 lg:flex lg:flex-col">
        <div className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[var(--primary-soft)] blur-3xl" />
        <div className="relative flex items-center gap-2.5 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--text)] text-[var(--surface)]"><Sparkles className="h-4 w-4" /></span> DevKnowledge</div>
        <div className="relative my-auto max-w-xl">
          <div className="mb-[var(--space-section-small)] inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-soft)]"><Braces className="h-3.5 w-3.5 text-[var(--primary)]" /> Built for engineering knowledge</div>
          <h1 className="text-5xl font-semibold leading-[1.08] tracking-[-0.05em]">Keep the reason behind every change.</h1>
          <p className="mt-[var(--space-section)] max-w-lg text-base leading-7 text-[var(--text-soft)]">Code snippets, technical documentation, discussions, and AI guidance in one calm workspace.</p>
        </div>
        <p className="relative text-xs text-[var(--text-muted)]">Minimal by design. Useful by default.</p>
      </section>
      <section className="flex items-center justify-center px-[var(--space-section)] py-12 sm:px-10">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 lg:hidden"><span className="inline-flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5 text-[var(--primary)]" /> DevKnowledge</span></div>
          <h2 className="text-3xl font-semibold tracking-[-0.04em]">Welcome back</h2>
          <p className="mt-2 text-sm text-[var(--text-soft)]">Sign in to continue to your engineering workspace.</p>
          <div className="mt-8"><Suspense><LoginForm /></Suspense></div>
          <p className="mt-[var(--space-section)] text-center text-sm text-[var(--text-soft)]">New to DevKnowledge? <Link href="/register" className="font-medium text-[var(--text)] underline decoration-[var(--border-strong)] underline-offset-4">Create account</Link></p>
        </div>
      </section>
    </div>
  );
}
