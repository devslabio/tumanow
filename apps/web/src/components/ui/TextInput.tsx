import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import type { LucideIcon } from "lucide-react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/cn";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  startIcon?: LucideIcon;
  endAdornment?: ReactNode;
  invalid?: boolean;
};

export function TextInput({
  startIcon: StartIcon,
  endAdornment,
  invalid,
  className = "",
  disabled,
  ...props
}: TextInputProps) {
  return (
    <div
      className={cn(
        "tn-input-shell",
        invalid && "is-invalid",
        disabled && "is-disabled",
      )}
    >
      {StartIcon ? (
        <span className="tn-input-icon" aria-hidden>
          <StartIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
        </span>
      ) : null}
      <input
        {...props}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn("tn-input-control", className)}
      />
      {endAdornment ? (
        <span className="tn-input-suffix">{endAdornment}</span>
      ) : null}
    </div>
  );
}

type SelectInputProps = SelectHTMLAttributes<HTMLSelectElement> & {
  startIcon?: LucideIcon;
  invalid?: boolean;
};

export function SelectInput({
  startIcon: StartIcon,
  invalid,
  className = "",
  disabled,
  children,
  ...props
}: SelectInputProps) {
  return (
    <div
      className={cn(
        "tn-input-shell",
        invalid && "is-invalid",
        disabled && "is-disabled",
      )}
    >
      {StartIcon ? (
        <span className="tn-input-icon" aria-hidden>
          <StartIcon className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
        </span>
      ) : null}
      <select
        {...props}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn("tn-input-control tn-input-select", className)}
      >
        {children}
      </select>
    </div>
  );
}

export function PasswordToggleButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="tn-password-toggle"
      aria-label={visible ? "Hide password" : "Show password"}
      tabIndex={-1}
    >
      {visible ? (
        <EyeOff className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
      ) : (
        <Eye className="h-[1.125rem] w-[1.125rem]" strokeWidth={1.85} />
      )}
    </button>
  );
}
