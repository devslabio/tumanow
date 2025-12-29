import React from 'react';
import Skeleton from './Skeleton';

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
}

export default function DataTableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  showActions = true,
}: DataTableSkeletonProps) {
  return (
    <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
      {showHeader && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} height={20} width={i === 0 ? 120 : i === columns - 1 && showActions ? 80 : 150} />
            ))}
          </div>
        </div>
      )}
      <div className="divide-y divide-gray-200 overflow-x-auto">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex items-center gap-4 min-w-max">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className={colIndex === columns - 1 && showActions ? '' : 'flex-1 min-w-[100px]'}>
                  {colIndex === 0 ? (
                    <Skeleton height={16} width={120} />
                  ) : colIndex === columns - 1 && showActions ? (
                    <div className="flex items-center gap-2 justify-end">
                      <Skeleton height={32} width={32} rounded="md" />
                      <Skeleton height={32} width={32} rounded="md" />
                    </div>
                  ) : (
                    <Skeleton height={16} width={colIndex === 1 ? 180 : 100} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

