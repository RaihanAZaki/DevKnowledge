"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Button, Input, Label } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password") }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to create account.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-[440px]">
        <Link href="/" className="mb-10 inline-flex items-center gap-2.5 font-semibold"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--text)] text-[var(--surface)]"><Sparkles className="h-4 w-4" /></span> DevKnowledge</Link>
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">Create your workspace account</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">Start documenting changes while the context is still fresh.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div><Label>Full name</Label><Input name="name" placeholder="Your name" required /></div>
          <div><Label>Email</Label><Input name="email" type="email" placeholder="you@company.com" required /></div>
          <div><Label>Password</Label><Input name="password" type="password" minLength={8} placeholder="Minimum 8 characters" required /></div>
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">{error}</div> : null}
          <Button className="w-full" disabled={loading}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Create account <ArrowRight className="h-4 w-4" /></Button>
        </form>
        <p className="mt-7 text-center text-sm text-[var(--text-soft)]">Already have an account? <Link href="/login" className="font-medium text-[var(--text)] underline decoration-[var(--border-strong)] underline-offset-4">Sign in</Link></p>
      </div>
    </div>
  );
}
