'use client';

import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import Icon, { faArrowRight } from './Icon';
import Link from 'next/link';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  href?: string;
  loading?: boolean;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  iconColor?: string;
  iconBgColor?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  href,
  loading = false,
  subtitle,
  trend,
  iconColor = '#0b66c2',
  iconBgColor = '#e6f0ff'
}: StatCardProps) {
  const content = (
    <div className="bg-white rounded-sm border border-gray-200 p-4 hover:border-gray-300 transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mb-0.5">
            {loading ? (
              <span className="inline-block h-7 w-16 bg-gray-200 rounded animate-pulse"></span>
            ) : (
              value
            )}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">{subtitle}</div>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value >= 0 ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        <div 
          className="p-2.5 rounded-lg transition-colors flex-shrink-0 ml-3"
          style={{ 
            backgroundColor: iconBgColor,
          }}
        >
          <div style={{ color: iconColor }}>
            <Icon 
              icon={icon} 
              size="lg" 
            />
          </div>
        </div>
      </div>
      {href && (
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-600 group-hover:text-[#0b66c2] transition-colors">
            <span>View details</span>
            <Icon icon={faArrowRight} className="ml-1.5" size="xs" />
          </div>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
