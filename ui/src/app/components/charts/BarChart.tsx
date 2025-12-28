'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface BarChartProps {
  title?: string;
  data: Array<{ x: string | number; y: number }>;
  colors?: string[];
  height?: number;
  horizontal?: boolean;
}

export default function BarChart({
  title,
  data,
  colors = ['#0b66c2'],
  height = 300,
  horizontal = false,
}: BarChartProps) {
  const series = [
    {
      name: title || 'Data',
      data: data.map((item) => item.y),
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: horizontal,
        borderRadius: 4,
        dataLabels: {
          position: horizontal ? 'center' : 'top',
        },
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '12px',
        colors: ['#fff'],
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
        type="bar"
        height={height}
      />
    </div>
  );
}

