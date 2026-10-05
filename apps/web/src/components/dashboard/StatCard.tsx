import type { ReactNode } from "react";

import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type StatCardProps = {
  title: string;
  value: ReactNode;
  hint?: string;
  footer?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

/** SitBites-style KPI card, branded for TumaNow. */
export function DashboardStatCard({
  title,
  value,
  hint,
  footer,
  icon,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("min-w-0 !p-3.5 sm:!p-4", className)}>
      <div className="flex min-w-0 items-start justify-between gap-2">
        <p className="min-w-0 break-words text-xs font-medium text-[var(--tn-muted)]">
          {title}
        </p>
        {icon ? (
          <span className="shrink-0 text-[var(--tn-muted)] [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
        ) : null}
      </div>
      <div
        className="mt-2 min-w-0 break-words text-xl font-semibold leading-tight tabular-nums tracking-tight text-[var(--foreground)] sm:text-2xl sm:leading-none"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {value}
      </div>
      {hint ? (
        <p className="mt-1 break-words text-xs leading-snug text-[var(--tn-muted)]">
          {hint}
        </p>
      ) : null}
      {footer ? (
        <p className="mt-2 break-words border-t border-[var(--tn-border-subtle)] pt-2 text-[11px] leading-snug text-[var(--tn-muted)]">
          {footer}
        </p>
      ) : null}
    </Card>
  );
}
