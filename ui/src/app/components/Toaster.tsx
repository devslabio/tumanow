'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import Toast, { Toast as ToastType, ToastType as ToastTypeEnum } from '@/app/components/Toast';

interface ToastContextType {
  show: (message: string, type?: ToastTypeEnum, duration?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastIdCounter = 0;
let globalToastHandler: ToastContextType | null = null;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const handlerRef = useRef<ToastContextType | null>(null);

  const show = useCallback((message: string, type: ToastTypeEnum = 'info', duration: number = 5000) => {
    const id = `toast-${++toastIdCounter}-${Date.now()}`;
    const newToast: ToastType = {
      id,
      message,
      type,
      duration,
    };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = { show, dismiss, clear };

  // Store global handler for toast convenience functions
  useEffect(() => {
    globalToastHandler = contextValue;
    handlerRef.current = contextValue;
    return () => {
      globalToastHandler = null;
    };
  }, [show, dismiss, clear]);

  // Listen for toast events
  useEffect(() => {
    const handleToastEvent = (event: CustomEvent) => {
      const { message, type, duration } = event.detail;
      handlerRef.current?.show(message, type, duration);
    };

    window.addEventListener('toast' as any, handleToastEvent as EventListener);
    return () => {
      window.removeEventListener('toast' as any, handleToastEvent as EventListener);
    };
  }, []);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-md">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto animate-slide-in-right">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Convenience functions that work globally
export const toast = {
  success: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      if (globalToastHandler) {
        globalToastHandler.show(message, 'success', duration);
      } else {
        const event = new CustomEvent('toast', { detail: { message, type: 'success', duration } });
        window.dispatchEvent(event);
      }
    }
  },
  error: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      if (globalToastHandler) {
        globalToastHandler.show(message, 'error', duration);
      } else {
        const event = new CustomEvent('toast', { detail: { message, type: 'error', duration } });
        window.dispatchEvent(event);
      }
    }
  },
  info: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      if (globalToastHandler) {
        globalToastHandler.show(message, 'info', duration);
      } else {
        const event = new CustomEvent('toast', { detail: { message, type: 'info', duration } });
        window.dispatchEvent(event);
      }
    }
  },
  warning: (message: string, duration?: number) => {
    if (typeof window !== 'undefined') {
      if (globalToastHandler) {
        globalToastHandler.show(message, 'warning', duration);
      } else {
        const event = new CustomEvent('toast', { detail: { message, type: 'warning', duration } });
        window.dispatchEvent(event);
      }
    }
  },
};

