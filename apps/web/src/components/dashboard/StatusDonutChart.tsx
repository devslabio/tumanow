"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { useChartPalette } from "./use-chart-palette";

export type DonutSlice = { name: string; value: number };

const DEFAULT_COLORS = [
  "var(--tn-primary)",
  "#1a2332",
  "#f5c4a8",
  "#c44d12",
  "#6b7280",
  "#2a9d8f",
] as const;

type StatusDonutChartProps = {
  data: readonly DonutSlice[];
  colors?: readonly string[];
  centerTitle?: string;
};

export function StatusDonutChart({
  data,
  colors = DEFAULT_COLORS,
  centerTitle = "Total",
}: StatusDonutChartProps) {
  const p = useChartPalette();
  const rows = data.length > 0 ? [...data] : [{ name: "No data", value: 1 }];
  const total = rows.reduce((sum, d) => sum + d.value, 0);
  const isPlaceholder = rows.length === 1 && rows[0]?.name === "No data";

  return (
    <div className="flex h-full min-h-[220px] flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-6">
      <div className="relative mx-auto h-[200px] w-[200px] shrink-0 sm:mx-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {rows.map((slice, i) => (
                <Cell
                  key={slice.name}
                  fill={
                    isPlaceholder
                      ? "#e8ddd6"
                      : (colors[i % colors.length] ?? DEFAULT_COLORS[0])
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number | string) => {
                const n = typeof value === "number" ? value : Number(value);
                const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                return [`${n} (${pct}%)`, ""];
              }}
              contentStyle={{
                backgroundColor: p.tooltipBg,
                border: `1px solid ${p.tooltipBorder}`,
                borderRadius: "var(--radius-shell)",
                fontSize: "0.875rem",
              }}
              labelStyle={{ color: p.tooltipLabel, fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-medium text-[var(--tn-muted)]">
            {centerTitle}
          </span>
          <span
            className="text-xl font-semibold tabular-nums text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {isPlaceholder ? 0 : total}
          </span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col justify-center gap-2 text-sm">
        {isPlaceholder ? (
          <li className="py-4 text-center text-[var(--tn-muted)] sm:text-left">
            No shipments in this period.
          </li>
        ) : (
          rows.map((row, i) => {
            const fill = colors[i % colors.length] ?? DEFAULT_COLORS[0];
            const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
            return (
              <li
                key={row.name}
                className="flex items-center justify-between gap-3 border-b border-[var(--tn-border-subtle)] pb-2 last:border-b-0 last:pb-0"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: fill }}
                    aria-hidden
                  />
                  <span className="truncate text-[var(--tn-muted)]">
                    {row.name}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-[var(--foreground)]">
                  {row.value} · {pct}%
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
