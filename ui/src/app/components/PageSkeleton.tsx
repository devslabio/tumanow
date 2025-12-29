import React from 'react';
import Skeleton from './Skeleton';
import DataTableSkeleton from './DataTableSkeleton';

interface PageSkeletonProps {
  showHeader?: boolean;
  showFilters?: boolean;
  showTable?: boolean;
  showPagination?: boolean;
  tableColumns?: number;
  tableRows?: number;
}

export default function PageSkeleton({
  showHeader = true,
  showFilters = true,
  showTable = true,
  showPagination = true,
  tableColumns = 5,
  tableRows = 5,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1">
            <Skeleton height={32} width={200} className="mb-2" />
            <Skeleton height={16} width={300} />
          </div>
          <Skeleton height={40} width={120} rounded="md" />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="sm:col-span-2 md:col-span-2">
              <Skeleton height={40} width="100%" rounded="md" />
            </div>
            <Skeleton height={40} width="100%" rounded="md" />
            <Skeleton height={40} width="100%" rounded="md" />
          </div>
        </div>
      )}

      {/* Table */}
      {showTable && (
        <DataTableSkeleton
          rows={tableRows}
          columns={tableColumns}
          showHeader
        />
      )}

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <Skeleton height={16} width={150} />
          <div className="flex items-center gap-2">
            <Skeleton height={36} width={36} rounded="md" />
            <Skeleton height={36} width={36} rounded="md" />
            <Skeleton height={36} width={36} rounded="md" />
            <Skeleton height={36} width={36} rounded="md" />
          </div>
        </div>
      )}
    </div>
  );
}

