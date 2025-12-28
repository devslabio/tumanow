'use client';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface DonutChartProps {
  title?: string;
  data: Array<{ label: string; value: number }>;
  colors?: string[];
  height?: number;
}

export default function DonutChart({
  title,
  data,
  colors = ['#0b66c2', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  height = 300,
}: DonutChartProps) {
  const series = data.map((item) => item.value);
  const labels = data.map((item) => item.label);

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: {
        show: false,
      },
    },
    labels: labels,
    colors: colors,
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '10px',
      fontFamily: 'inherit',
      labels: {
        colors: '#6b7280',
      },
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
      markers: {
        width: 2,
        height: 2,
        radius: 1,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '10px',
        colors: ['#fff'],
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '12px',
              fontWeight: 600,
              color: '#374151',
            },
          },
        },
      },
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
        type="donut"
        height={height}
      />
    </div>
  );
}

