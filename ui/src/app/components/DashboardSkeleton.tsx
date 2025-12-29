import React from 'react';
import StatCardSkeleton from './StatCardSkeleton';
import ChartSkeleton from './ChartSkeleton';
import Skeleton from './Skeleton';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={250} showTitle />
        <ChartSkeleton height={250} showTitle />
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartSkeleton height={200} showTitle showLegend />
        <ChartSkeleton height={200} showTitle showLegend />
        <ChartSkeleton height={200} showTitle showLegend />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-sm border border-gray-200 p-6">
        <Skeleton height={24} width={200} className="mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
              <Skeleton variant="circular" width={40} height={40} />
              <div className="flex-1 space-y-2">
                <Skeleton height={16} width="60%" />
                <Skeleton height={12} width="40%" />
              </div>
              <Skeleton height={20} width={80} rounded="full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

