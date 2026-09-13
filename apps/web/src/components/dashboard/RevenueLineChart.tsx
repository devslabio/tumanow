"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartPalette } from "./use-chart-palette";

type Point = { day: string; revenue: number };

type RevenueLineChartProps = {
  data: readonly Point[];
};

export function RevenueLineChart({ data }: RevenueLineChartProps) {
  const p = useChartPalette();
  const rows = data.length > 0 ? [...data] : [{ day: "—", revenue: 0 }];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: p.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: p.grid }}
        />
        <YAxis
          tick={{ fill: p.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(v) =>
            Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : String(v)
          }
        />
        <Tooltip
          formatter={(value: number | string) => [
            `${Number(value).toLocaleString()} RWF`,
            "Revenue",
          ]}
          contentStyle={{
            backgroundColor: p.tooltipBg,
            border: `1px solid ${p.tooltipBorder}`,
            borderRadius: "var(--radius-shell)",
            fontSize: "0.875rem",
          }}
          labelStyle={{ color: p.tooltipLabel, fontWeight: 600 }}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="Revenue"
          stroke="var(--tn-primary-dark)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "var(--tn-primary)" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
