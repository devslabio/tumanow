import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({
  className = '',
  width,
  height,
  rounded = 'md',
  variant = 'rectangular',
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`skeleton ${variantClasses[variant]} ${roundedClasses[rounded]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '75%' : '100%'}
          className="h-4"
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton variant="circular" width={size} height={size} />;
}

export function SkeletonButton({ width = 100 }: { width?: number }) {
  return <Skeleton height={36} width={width} rounded="md" />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-sm p-4 ${className}`}>
      <SkeletonText lines={3} />
    </div>
  );
}

