"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { registerAction, type RegisterActionState } from "./actions";

const initialState: RegisterActionState = {};

const inputClasses =
  "mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-medium text-accent-600">{message}</p>;
}

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );
  const errors = state.errors ?? {};

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormError message={errors.form} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-ink-800">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          placeholder="Your full name"
          aria-invalid={errors.name ? true : undefined}
          className={inputClasses}
        />
        <FieldError message={errors.name} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-800">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          aria-invalid={errors.email ? true : undefined}
          className={inputClasses}
        />
        <FieldError message={errors.email} />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-ink-800">
          Mobile number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="10-digit mobile number"
          aria-invalid={errors.phone ? true : undefined}
          className={inputClasses}
        />
        <FieldError message={errors.phone} />
      </div>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="new-password"
        error={errors.password}
        placeholder="At least 8 characters with a number"
      />

      <PasswordField
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirmPassword}
        placeholder="Re-enter your password"
      />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
