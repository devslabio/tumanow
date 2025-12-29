import React from 'react';
import Skeleton from './Skeleton';

interface ChartSkeletonProps {
  height?: number;
  showLegend?: boolean;
  showTitle?: boolean;
}

export default function ChartSkeleton({
  height = 300,
  showLegend = true,
  showTitle = true,
}: ChartSkeletonProps) {
  return (
    <div className="bg-white rounded-sm border border-gray-200 p-4 sm:p-6">
      {showTitle && (
        <div className="mb-4">
          <Skeleton height={20} width={200} className="mb-2" />
          <Skeleton height={14} width={150} />
        </div>
      )}
      <div className="relative overflow-x-auto" style={{ height: `${height}px`, minHeight: '200px' }}>
        {/* Chart bars/lines skeleton */}
        <div className="absolute inset-0 flex items-end justify-between gap-1 sm:gap-2 px-2 sm:px-4 pb-4 min-w-max w-full">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton
              key={i}
              height={`${Math.random() * 60 + 40}%`}
              width="100%"
              rounded="sm"
              className="min-w-[20px] sm:min-w-[30px]"
            />
          ))}
        </div>
      </div>
      {showLegend && (
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-200 flex-wrap">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton variant="circular" width={12} height={12} />
              <Skeleton height={14} width={60} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

