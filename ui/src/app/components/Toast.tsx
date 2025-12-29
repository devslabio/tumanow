'use client';

import { useEffect } from 'react';
import Icon, { faCheckCircle, faExclamationCircle, faCircle, faTimes, faTimesCircle } from '@/app/components/Icon';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

export default function Toast({ toast, onDismiss }: ToastProps) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onDismiss]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faTimesCircle;
      case 'warning':
        return faExclamationCircle;
      case 'info':
      default:
        return faCircle;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-white',
          border: 'border-green-500',
          text: 'text-green-900',
          icon: 'text-green-600',
          iconBg: 'bg-white',
        };
      case 'error':
        return {
          bg: 'bg-white',
          border: 'border-red-500',
          text: 'text-red-900',
          icon: 'text-red-600',
          iconBg: 'bg-white',
        };
      case 'warning':
        return {
          bg: 'bg-white',
          border: 'border-yellow-500',
          text: 'text-yellow-900',
          icon: 'text-yellow-600',
          iconBg: 'bg-white',
        };
      case 'info':
      default:
        return {
          bg: 'bg-white',
          border: 'border-blue-500',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          iconBg: 'bg-white',
        };
    }
  };

  const colors = getColors();

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} ${colors.text}
        border rounded-[3px] p-4 min-w-[320px] max-w-md
        flex items-start gap-3
        transform transition-all duration-300 ease-out
        translate-x-0 opacity-100
        shadow-lg
      `}
      role="alert"
    >
      <div className={`${colors.iconBg} rounded-full p-2 flex-shrink-0`}>
        <Icon icon={getIcon()} className={colors.icon} size="sm" />
      </div>
      <div className="flex-1 text-sm font-semibold leading-relaxed">{toast.message}</div>
      <button
        onClick={() => onDismiss(toast.id)}
        className={`${colors.icon} hover:opacity-70 transition-opacity flex-shrink-0 p-1 rounded hover:bg-gray-50`}
        aria-label="Dismiss notification"
      >
        <Icon icon={faTimes} size="sm" />
      </button>
    </div>
  );
}

