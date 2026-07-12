"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/language-toggle";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenant";

interface NavItem {
  id: string;
  label: string;
  href: string;
}

function TenantBadge({ tenant }: { tenant: Tenant }) {
  return (
    <Link href={`/t/${tenant.slug}/proposals`} className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-lg font-display text-sm font-semibold"
        style={{
          background: tenant.branding.primaryColor,
          color: tenant.branding.primaryForeground,
        }}
      >
        {tenant.branding.logoText}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold text-ink">
          {tenant.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-3">
          {tenant.bodyType}
        </span>
      </span>
    </Link>
  );
}

function NavTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-full items-center px-1 text-sm font-medium transition-colors",
        active ? "text-ink" : "text-ink-3 hover:text-ink-2",
      )}
    >
      {children}
      {active && (
        <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
      )}
    </Link>
  );
}

export function TenantShell({
  tenant,
  navItems,
  children,
}: {
  tenant: Tenant;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useLang();
  const hasMultilingual = tenant.features.includes("multilingual");

  // scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  // Determine active nav item
  const activeModule = navItems.find((item) => pathname.startsWith(item.href));

  return (
    <div className="min-h-screen">
      {/* system bar */}
      <SystemBar tenant={tenant} />

      {/* tenant header */}
      <header className="sticky top-12 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <TenantBadge tenant={tenant} />
          <nav className="ml-4 hidden h-full items-center gap-6 md:flex">
            {navItems.map((item) => {
              const isActive = activeModule?.id === item.id;
              const label =
                item.id === "proposals"
                  ? t("nav.feed")
                  : item.id === "tally"
                    ? t("nav.tally")
                    : item.id === "budgeting"
                      ? t("nav.budget")
                      : item.label;
              return (
                <NavTab key={item.id} href={item.href} active={isActive}>
                  {item.id === "budgeting" && (
                    <Wallet size={14} className="mr-1.5" />
                  )}
                  {label}
                </NavTab>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            {hasMultilingual && <LanguageToggle />}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}

function SystemBar({ tenant }: { tenant: Tenant }) {
  return (
    <div className="sticky top-0 z-50 flex h-12 items-center gap-3 border-b border-system-line bg-system px-3 text-system-ink">
      {/* CIN wordmark */}
      <Link href="/" className="flex items-center gap-2 pr-1">
        <span className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
          </svg>
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight">
          CIN
        </span>
      </Link>

      <span className="hidden text-system-line sm:block">/</span>

      {/* current tenant badge */}
      <div className="flex h-8 items-center gap-2.5 rounded-md border border-system-line bg-system-2 pl-1.5 pr-2">
        <span
          className="grid h-6 w-6 place-items-center rounded-md font-display text-[13px] font-semibold leading-none"
          style={{
            background: tenant.branding.primaryColor,
            color: tenant.branding.primaryForeground,
          }}
        >
          {tenant.branding.logoText}
        </span>
        <span className="flex flex-col leading-none">
          <span className="text-[13px] font-medium">{tenant.name}</span>
          <span className="font-mono text-[10px] text-system-ink-2">
            {tenant.bodyType}
          </span>
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* feature flags readout */}
        <div className="hidden items-center gap-1.5 font-mono text-[11px] text-system-ink-2 md:flex">
          <span className="text-system-ink-2">flags:</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              tenant.features.includes("budgeting")
                ? "bg-white/5 text-system-ink"
                : "opacity-40",
            )}
          >
            budgeting
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              tenant.features.includes("multilingual")
                ? "bg-white/5 text-system-ink"
                : "opacity-40",
            )}
          >
            multilingual
          </span>
        </div>
      </div>
    </div>
  );
}
