"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
};

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = "max-w-lg",
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end justify-center overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-start sm:px-4 sm:py-10"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/35 backdrop-blur-[6px]" />
      <div
        className={cn(
          "relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-t-[16px] border border-[var(--tn-border)] bg-white shadow-[var(--shadow-panel)] sm:max-h-[calc(100dvh-5rem)] sm:rounded-[var(--radius-shell)]",
          maxWidth,
        )}
        role="dialog"
        aria-modal
        aria-label={title}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--tn-border)] px-4 py-3 sm:px-5 sm:py-3.5">
          <h2
            className="min-w-0 truncate text-base font-semibold tracking-tight text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center rounded-[var(--radius-field)] p-2 text-[var(--tn-muted)] transition-colors hover:bg-[var(--tn-field-bg)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-[var(--tn-border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
