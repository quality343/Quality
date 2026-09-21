import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight text-ink-900">
        Create your patient account
      </h1>
      <p className="mt-1.5 text-sm text-ink-500">
        Book appointments, view results, and follow your care — all in one place.
      </p>

      <div className="mt-6">
        <RegisterForm />
      </div>

      <p className="mt-6 text-sm text-ink-500">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-700 hover:text-brand-800 hover:underline"
        >
          Log in
        </Link>
      </p>

      <p className="mt-6 rounded-lg bg-surface-muted p-3 text-xs leading-relaxed text-ink-500">
        By creating an account you agree to our patient terms and privacy practices.
        We collect only what care requires — clinical information is added later by
        your care team.
      </p>
    </div>
  );
}
