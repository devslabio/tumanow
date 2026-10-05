"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useChartPalette } from "./use-chart-palette";

type Point = { day: string; shipments: number };

type ShipmentsAreaChartProps = {
  data: readonly Point[];
  seriesName?: string;
};

export function ShipmentsAreaChart({
  data,
  seriesName = "Shipments",
}: ShipmentsAreaChartProps) {
  const p = useChartPalette();
  const fillId = `tn-area-fill-${useId().replace(/:/g, "")}`;
  const rows =
    data.length > 0 ? [...data] : [{ day: "—", shipments: 0 }];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <AreaChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--tn-primary)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--tn-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: p.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={{ stroke: p.grid }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: p.axis, fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          cursor={{ stroke: p.grid }}
          contentStyle={{
            backgroundColor: p.tooltipBg,
            border: `1px solid ${p.tooltipBorder}`,
            borderRadius: "var(--radius-shell)",
            fontSize: "0.875rem",
          }}
          labelStyle={{ color: p.tooltipLabel, fontWeight: 600 }}
        />
        <Area
          type="monotone"
          dataKey="shipments"
          name={seriesName}
          stroke="var(--tn-primary)"
          strokeWidth={2}
          fill={`url(#${fillId})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
