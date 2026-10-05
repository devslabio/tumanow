"use client";

import { useEffect, useState } from "react";

export type ChartPalette = {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipLabel: string;
};

/** Light palette tuned to TumaNow warm off-white surfaces. */
export function useChartPalette(): ChartPalette {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  void ready;

  return {
    grid: "#e8ddd6",
    axis: "#6b7280",
    tooltipBg: "#ffffff",
    tooltipBorder: "#e8ddd6",
    tooltipLabel: "#1a2332",
  };
}
