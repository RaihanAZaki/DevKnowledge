export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">{eyebrow}</div> : null}
        <h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-[30px]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-soft)]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
