"use client";

import { logoutAction } from "@/app/(auth)/logout/actions";

export function PortalSignOut() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface-muted"
      >
        Log out
      </button>
    </form>
  );
}
