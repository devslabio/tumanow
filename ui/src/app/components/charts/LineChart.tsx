'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface LineChartProps {
  title?: string;
  data: Array<{ x: string | number; y: number }>;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
}

export default function LineChart({
  title,
  data,
  colors = ['#0b66c2'],
  height = 300,
  showLegend = false,
}: LineChartProps) {
  const series = [
    {
      name: title || 'Data',
      data: data.map((item) => item.y),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'line',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    colors: colors,
    xaxis: {
      categories: data.map((item) => item.x),
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#6b7280',
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 4,
    },
    legend: {
      show: showLegend,
      position: 'top',
      horizontalAlign: 'right',
    },
    tooltip: {
      theme: 'light',
    },
    markers: {
      size: 4,
      hover: {
        size: 6,
      },
    },
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <Chart
        options={options}
        series={series}
        type="line"
        height={height}
      />
    </div>
  );
}

