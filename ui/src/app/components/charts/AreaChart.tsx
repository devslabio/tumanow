'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface AreaChartProps {
  title?: string;
  data: Array<{ x: string | number; y: number }>;
  colors?: string[];
  height?: number;
  showLegend?: boolean;
}

export default function AreaChart({
  title,
  data,
  colors = ['#0b66c2'],
  height = 300,
  showLegend = false,
}: AreaChartProps) {
  const series = [
    {
      name: title || 'Data',
      data: data.map((item) => item.y),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'area',
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
      width: 2,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
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
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <Chart
        options={options}
        series={series}
        type="area"
        height={height}
      />
    </div>
  );
}

