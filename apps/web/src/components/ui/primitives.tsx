import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--tn-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`tn-panel p-4 sm:p-5 ${className}`}>{children}</div>;
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--tn-muted)]">
        {label}
      </p>
      <p
        className="mt-2 text-2xl font-bold tracking-tight text-foreground"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--tn-muted)]">{hint}</p> : null}
    </Card>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="rounded-[var(--radius-shell)] border border-dashed border-[var(--tn-border)] bg-white/50 px-6 py-12 text-center">
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-[var(--tn-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
