'use client';

import Icon, { faSpinner } from './Icon';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`.trim()}>
      <Icon icon={faSpinner} spin className={sizeClasses[size]} />
      {text && <p className="text-sm text-gray-600">{text}</p>}
    </div>
  );
}

