"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ROLE_LABEL } from "@/lib/auth/role-labels";
import { PortalSignOut } from "@/components/layout/PortalSignOut";
import type { UserRole } from "@prisma/client";

export type PortalNavItem = { href: string; label: string; icon: IconName };

type PortalShellProps = {
  areaTitle: string;
  items: PortalNavItem[];
  user: { name: string; email: string; role: UserRole };
  logoSrc?: string | null;
  logoMarkSrc?: string | null;
  /** Only set where a profile page actually exists — never link to a 404. */
  profileHref?: string;
  children: React.ReactNode;
};

export function PortalShell({
  areaTitle,
  items,
  user,
  logoSrc,
  logoMarkSrc,
  profileHref,
  children,
}: PortalShellProps) {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href.split("/").filter(Boolean).length <= 2
      ? pathname === href
      : pathname.startsWith(href);

  const nav = (
    <nav aria-label={`${areaTitle} navigation`} className="flex flex-col gap-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            isActive(item.href)
              ? "bg-brand-50 text-brand-700"
              : "text-ink-600 hover:bg-surface-muted hover:text-ink-900"
          }`}
        >
          <Icon name={item.icon} className="h-5 w-5 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const userMenu = (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-muted"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
          {user.name.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink-900">
            {user.name}
          </span>
          <span className="block truncate text-xs text-ink-500">
            {ROLE_LABEL[user.role]}
          </span>
        </span>
      </button>
      {menuOpen ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-50 mb-2 w-full rounded-xl border border-border bg-surface p-2 shadow-lift"
        >
          {profileHref ? (
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-surface-muted"
            >
              <Icon name="users" className="h-4 w-4" />
              Profile
            </Link>
          ) : null}
          <LogoutButton />
        </div>
      ) : null}
    </div>
  );

  const sidebarInner = (mobileClose?: boolean) => (
    <>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3.5">
        <BrandLogo
          withHomeLink
          logoSrc={logoSrc}
          logoMarkSrc={logoMarkSrc}
          variant="mark"
        />
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold uppercase tracking-wide text-ink-400 sm:inline lg:hidden xl:inline">
            {areaTitle}
          </span>
          {mobileClose ? (
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-700 lg:hidden"
            >
              <Icon name="x" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">{nav}</div>
      <div className="border-t border-border p-3">{userMenu}</div>
    </>
  );

  return (
    <div className="min-h-screen bg-surface-muted lg:flex">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <BrandLogo withHomeLink logoSrc={logoSrc} logoMarkSrc={logoMarkSrc} variant="mark" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            {areaTitle}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="portal-drawer"
            aria-label="Open menu"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-ink-700"
          >
            <Icon name="menu" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-surface lg:block">
        <div className="sticky top-0 flex h-screen flex-col">{sidebarInner(false)}</div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-900/40"
          />
          <div
            id="portal-drawer"
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-lift"
          >
            {sidebarInner(true)}
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <main id="main-content" className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function LogoutButton() {
  return <PortalSignOut />;
}
