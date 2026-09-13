"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartPalette } from "./use-chart-palette";

type Row = { label: string; shipments: number };

type HorizontalBarChartProps = {
  data: readonly Row[];
  valueLabel?: string;
};

export function HorizontalBarChart({
  data,
  valueLabel = "Shipments",
}: HorizontalBarChartProps) {
  const p = useChartPalette();
  const rows =
    data.length > 0 ? [...data] : [{ label: "No data", shipments: 0 }];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} horizontal />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fill: p.axis, fontSize: 12 }}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={112}
          tick={{ fill: p.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: p.grid }}
        />
        <Tooltip
          cursor={{ fill: "color-mix(in srgb, var(--tn-primary) 8%, transparent)" }}
          contentStyle={{
            backgroundColor: p.tooltipBg,
            border: `1px solid ${p.tooltipBorder}`,
            borderRadius: "var(--radius-shell)",
            fontSize: "0.875rem",
          }}
          labelStyle={{ color: p.tooltipLabel, fontWeight: 600 }}
        />
        <Bar
          dataKey="shipments"
          name={valueLabel}
          fill="var(--tn-accent)"
          radius={[0, 4, 4, 0]}
          maxBarSize={28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
