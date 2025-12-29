import React from 'react';
import ChartSkeleton from './ChartSkeleton';
import Skeleton from './Skeleton';

export default function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm p-6">
            <Skeleton height={14} width={120} className="mb-2" />
            <Skeleton height={36} width={100} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={300} showTitle showLegend />
        <ChartSkeleton height={300} showTitle showLegend />
      </div>

      {/* Additional Chart */}
      <ChartSkeleton height={250} showTitle />
    </div>
  );
}

