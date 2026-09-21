"use client";

import { useId, useState } from "react";

type PasswordFieldProps = {
  name: string;
  label: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
};

export function PasswordField({
  name,
  label,
  autoComplete = "current-password",
  required = true,
  error,
  placeholder,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-ink-800">
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`block w-full rounded-lg border bg-surface px-3.5 py-2.5 pr-20 text-sm text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 ${
            error ? "border-accent-500" : "border-border"
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          className="absolute inset-y-1 right-1.5 my-auto inline-flex h-8 items-center rounded-md px-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-accent-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
