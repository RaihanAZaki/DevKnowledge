"use client";

import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { LoaderCircle } from "lucide-react";

export function Button({ className = "", children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 bg-[var(--text)] text-[var(--surface)] hover:opacity-90 active:scale-[.99] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({ className = "", children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm font-medium text-[var(--text-soft)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--text)] ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`field h-11 px-3.5 text-sm ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`field min-h-32 resize-y px-3.5 py-3 text-sm ${className}`} {...props} />;
}

export function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-sm font-medium text-[var(--text)]">{children}</label>;
}

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "primary" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-[var(--surface-soft)] text-[var(--text-soft)] border-[var(--border)]",
    primary: "bg-[var(--primary-soft)] text-[var(--primary)] border-transparent",
    success: "bg-emerald-50/70 text-[var(--success)] border-transparent dark:bg-emerald-950/20",
    warning: "bg-amber-50/80 text-[var(--warning)] border-transparent dark:bg-amber-950/20",
    danger: "bg-red-50/80 text-[var(--danger)] border-transparent dark:bg-red-950/20",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[var(--text-muted)]">
      <LoaderCircle className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-14 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-soft)]">{description}</p>
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}
