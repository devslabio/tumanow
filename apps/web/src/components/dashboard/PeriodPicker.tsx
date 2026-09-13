"use client";

type PeriodOption = 7 | 14 | 30;

const OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 7, label: "7d" },
  { value: 14, label: "14d" },
  { value: 30, label: "30d" },
];

export function PeriodPicker({
  value,
  onChange,
}: {
  value: PeriodOption;
  onChange: (days: PeriodOption) => void;
}) {
  return (
    <div
      className="inline-flex rounded-[var(--radius-field)] border border-[var(--tn-border)] bg-white p-0.5"
      role="group"
      aria-label="Period"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`min-h-8 rounded-[calc(var(--radius-field)-2px)] px-3 text-xs font-semibold transition-colors ${
              active
                ? "bg-[var(--tn-primary)] text-white"
                : "text-[var(--tn-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export type { PeriodOption };
