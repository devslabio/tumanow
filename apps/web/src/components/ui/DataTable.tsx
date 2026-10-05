import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export type DataTableColumn = {
  key: string;
  title: string;
  className?: string;
};

export type DataTableProps = {
  columns: DataTableColumn[];
  rows: Record<string, ReactNode>[];
  emptyLabel?: string;
  className?: string;
  rowKeys?: Array<string | number>;
  numbered?: boolean;
  numberOffset?: number;
  onRowClick?: (rowIndex: number) => void;
  getRowClassName?: (rowIndex: number) => string | undefined;
  stopPropagationOnCellKeys?: string[];
};

const thBase =
  "sticky top-0 z-[1] bg-[color-mix(in_srgb,var(--page-bg)_88%,white)] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tn-muted)] sm:px-4 sm:py-3";
const tdBase = "px-3 py-2.5 text-sm text-[var(--foreground)] sm:px-4 sm:py-3";

export function DataTable({
  columns,
  rows,
  emptyLabel = "No data yet.",
  className,
  rowKeys,
  numbered = true,
  numberOffset = 0,
  onRowClick,
  getRowClassName,
  stopPropagationOnCellKeys,
}: DataTableProps) {
  const colSpan = columns.length + (numbered ? 1 : 0);

  return (
    <div className={cn("tn-panel max-w-full min-w-0 overflow-hidden", className)}>
      <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[28rem] border-collapse text-sm sm:min-w-[36rem]">
          <thead>
            <tr className="border-b border-[var(--tn-border)]">
              {numbered ? (
                <th
                  scope="col"
                  className={cn(thBase, "w-12 whitespace-nowrap text-right tabular-nums")}
                >
                  #
                </th>
              ) : null}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(thBase, "whitespace-nowrap", col.className)}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--tn-border)]">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-4 py-12 text-center text-sm text-[var(--tn-muted)]"
                >
                  {emptyLabel}
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={rowKeys?.[ri] ?? ri}
                  className={cn(
                    "transition-colors duration-150 ease-[var(--ease-out)] hover:bg-[color-mix(in_srgb,var(--tn-primary)_5%,transparent)]",
                    onRowClick && "cursor-pointer",
                    getRowClassName?.(ri),
                  )}
                  onClick={onRowClick ? () => onRowClick(ri) : undefined}
                >
                  {numbered ? (
                    <td
                      className={cn(
                        tdBase,
                        "w-12 text-right tabular-nums text-[var(--tn-muted)]",
                      )}
                    >
                      {numberOffset + ri + 1}
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(tdBase, col.className)}
                      onClick={
                        stopPropagationOnCellKeys?.includes(col.key)
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function TablePrimaryCell({
  primary,
  secondary,
}: {
  primary: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium text-[var(--foreground)]">{primary}</div>
      {secondary != null && secondary !== "" ? (
        <div className="truncate text-xs text-[var(--tn-muted)]">{secondary}</div>
      ) : null}
    </div>
  );
}

export function TableBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "orange";
}) {
  const tones = {
    neutral: "bg-[var(--tn-field-bg)] text-[var(--foreground)]",
    success: "bg-[color-mix(in_srgb,#059669_12%,white)] text-[#047857]",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-800",
    orange:
      "bg-[color-mix(in_srgb,var(--tn-accent)_55%,white)] text-[var(--tn-primary-dark)]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[var(--radius-field)] px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
