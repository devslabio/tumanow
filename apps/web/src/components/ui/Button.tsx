import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--tn-primary)] text-white hover:bg-[var(--tn-primary-dark)]",
  secondary:
    "bg-[var(--tn-accent)] text-[#1a2332] hover:brightness-95",
  ghost:
    "bg-[var(--tn-field-bg)] text-foreground hover:bg-[var(--tn-field-bg-hover)]",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-field)] px-5 py-2.5 text-sm font-medium shadow-none transition-[background-color,box-shadow,opacity,transform] duration-150 ease-[var(--ease-out)] active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--tn-focus-ring)] disabled:pointer-events-none disabled:opacity-40 sm:min-h-9";

  return (
    <button
      {...props}
      type={type}
      className={`${base} ${variantClass[variant]} ${className}`}
    />
  );
}
