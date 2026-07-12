"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { DuoModal } from "@/components/duo-modal";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenant";

function readDisplayNameCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)cin_display_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function LoginClient({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [name, setName] = useState(() => readDisplayNameCookie());
  const [duoOpen, setDuoOpen] = useState(false);

  function onVerified() {
    if (!tenant) return;
    if (name.trim()) {
      const maxAge = 60 * 60 * 24 * 365;
      document.cookie = `cin_display_name=${encodeURIComponent(name.trim())}; path=/; max-age=${maxAge}`;
    }
    setDuoOpen(false);
    router.push(`/t/${tenant.slug}/proposals`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_100%_at_50%_-20%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_70%)]" />

      <div className="relative mx-auto max-w-md px-6 py-14">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-3">
          <LogIn size={13} />
          Sign in
        </div>

        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-2">
          Pick your institution to continue.
        </p>

        <div className="mt-6 space-y-2">
          {tenants.map((t) => {
            const active = tenant?.slug === t.slug;
            return (
              <button
                key={t.slug}
                onClick={() => setTenant(t)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-app)] border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary-soft/50 ring-1 ring-primary/25"
                    : "border-line bg-surface hover:border-line-strong",
                )}
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-[12px] font-semibold"
                  style={{
                    background: t.branding.primaryColor,
                    color: t.branding.primaryForeground,
                  }}
                >
                  {t.branding.logoText}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium text-ink">
                    {t.name}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-3">{t.bodyType}</span>
                </span>
                {active && <ShieldCheck size={15} className="text-primary" />}
              </button>
            );
          })}
        </div>

        {tenant && (
          <div className="mt-6">
            <Label>Your name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              autoFocus
            />

            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={!name.trim()}
              onClick={() => setDuoOpen(true)}
            >
              Sign in to {tenant.name}
              <ArrowRight size={17} />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
              <ShieldCheck size={13} className="text-ok" />
              Protected by two-factor authentication
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-[13px] text-ink-3">
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={onVerified}
        title="Confirm sign-in"
        context={tenant ? `Signing in to ${tenant.name}` : undefined}
      />
    </div>
  );
}
