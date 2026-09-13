import type { ReactNode } from "react";

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="tn-form-group">
      <label htmlFor={id} className="tn-form-label">
        {label}
      </label>
      {children}
      {error ? (
        <p className="tn-form-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
