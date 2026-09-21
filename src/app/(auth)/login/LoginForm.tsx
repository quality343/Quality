"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/auth/FormError";
import { PasswordField } from "@/components/auth/PasswordField";
import { loginAction, type LoginActionState } from "./actions";

const initialState: LoginActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error ? (
        <FormError
          message={
            state.error === "credentials"
              ? "Email/mobile or password is incorrect."
              : "Could not sign you in. Please try again."
          }
        />
      ) : null}

      <div>
        <label
          htmlFor="identifier"
          className="block text-sm font-medium text-ink-800"
        >
          Email or mobile number
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username"
          required
          defaultValue={state.identifier}
          placeholder="you@example.com or 9876543210"
          className="mt-1.5 block w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </div>

      <PasswordField name="password" label="Password" />

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}
