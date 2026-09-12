export default function AppLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading page">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded bg-[var(--surface-hover)]" />
        <div className="h-8 w-64 max-w-full rounded-lg bg-[var(--surface-hover)]" />
        <div className="h-4 w-96 max-w-full rounded bg-[var(--surface-hover)]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-36 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
        ))}
      </div>
      <div className="h-64 rounded-2xl border border-[var(--border)] bg-[var(--surface)]" />
    </div>
  );
}
