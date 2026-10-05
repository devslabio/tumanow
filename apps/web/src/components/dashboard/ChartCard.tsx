"use client";

import type { ReactNode } from "react";

import { ClientOnly } from "@/components/ui/ClientOnly";
import { Card } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  action,
}: ChartCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="mb-0 flex min-w-0 shrink-0 items-start justify-between gap-3 pb-4">
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-1 break-words text-sm text-[var(--tn-muted)]">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="h-[min(260px,42vh)] min-h-[200px] w-full min-w-0 shrink-0 overflow-x-auto overscroll-x-contain sm:h-[260px]">
        <ClientOnly
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-[var(--tn-muted)]">
              Loading chart…
            </div>
          }
        >
          {children}
        </ClientOnly>
      </div>
    </Card>
  );
}
