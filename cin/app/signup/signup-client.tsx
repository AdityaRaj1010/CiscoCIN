"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, GraduationCap, Landmark, ShieldCheck, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { DuoModal } from "@/components/duo-modal";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenant";

const SECTOR_OPTIONS: { id: string; label: string; blurb: string; icon: typeof GraduationCap }[] = [
  {
    id: "education",
    label: "College",
    blurb: "Students' union proposals, voting, and budgeting.",
    icon: GraduationCap,
  },
  {
    id: "government",
    label: "Panchayat",
    blurb: "Gram Sabha proposals, voting, and notices.",
    icon: Landmark,
  },
];

/**
 * There's no real account backend behind this (same as the rest of the
 * app — voting is a per-browser cookie identity, not a login). This form
 * exists to give the requested "client vs admin" fork a real front door:
 * it collects a name/email/constituency, runs the existing Duo mock, and
 * lands the person in the real, live `/t/[tenant]/proposals` feed — the
 * name they enter here is remembered (cin_display_name cookie) so it
 * flows into the Endorse button's vote attribution and, from there, into
 * any Webex room the vote-threshold integration creates.
 */
export function SignupClient({ tenants }: { tenants: Tenant[] }) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [sector, setSector] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [constituency, setConstituency] = useState("");
  const [duoOpen, setDuoOpen] = useState(false);

  const tenantsInSector = useMemo(
    () => (sector ? tenants.filter((t) => t.sector === sector) : []),
    [tenants, sector],
  );

  function pickSector(s: string) {
    setSector(s);
    setTenant(null);
    const options = tenants.filter((t) => t.sector === s);
    if (options.length === 1) {
      setTenant(options[0]);
      setStep(2);
    }
  }

  function pickTenant(t: Tenant) {
    setTenant(t);
    setStep(2);
  }

  const canSubmit = !!tenant && name.trim() && email.trim() && constituency.trim();

  function onVerified() {
    if (!tenant) return;
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `cin_display_name=${encodeURIComponent(name.trim())}; path=/; max-age=${maxAge}`;
    setDuoOpen(false);
    router.push(`/t/${tenant.slug}/proposals`);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_100%_at_50%_-20%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_70%)]" />

      <div className="relative mx-auto max-w-md px-6 py-14">
        <div className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-3">
          <Users2 size={13} />
          Client sign up
          <span className="ml-auto">Step {step} of 2</span>
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">
              I&apos;m signing up as part of a…
            </h1>
            <p className="mt-1.5 text-[14px] text-ink-2">
              Choose the kind of institution you belong to.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {SECTOR_OPTIONS.map((opt) => {
                const active = sector === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => pickSector(opt.id)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-[calc(var(--radius-app)+2px)] border p-4 text-left transition-all",
                      active
                        ? "border-primary bg-primary-soft/50 ring-1 ring-primary/25"
                        : "border-line bg-surface hover:border-line-strong",
                    )}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary-strong">
                      <opt.icon size={19} />
                    </span>
                    <span className="text-[15px] font-semibold text-ink">{opt.label}</span>
                    <span className="text-[12.5px] text-ink-2">{opt.blurb}</span>
                  </button>
                );
              })}
            </div>

            {sector && tenantsInSector.length === 0 && (
              <p className="mt-6 text-[13px] text-ink-3">
                No tenants are provisioned for this sector yet.{" "}
                <Link href="/admin/login" className="font-medium text-primary hover:underline">
                  Provision one
                </Link>
                .
              </p>
            )}

            {sector && tenantsInSector.length > 1 && (
              <div className="mt-6">
                <Label>Choose your institution</Label>
                <div className="space-y-2">
                  {tenantsInSector.map((t) => (
                    <button
                      key={t.slug}
                      onClick={() => pickTenant(t)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-app)] border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong"
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
                      <ArrowRight size={15} className="text-ink-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-[13px] text-ink-3">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {step === 2 && tenant && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-lg font-display text-[13px] font-semibold"
                style={{
                  background: tenant.branding.primaryColor,
                  color: tenant.branding.primaryForeground,
                }}
              >
                {tenant.branding.logoText}
              </span>
              <div>
                <p className="text-[14px] font-semibold text-ink">{tenant.name}</p>
                <p className="font-mono text-[10.5px] text-ink-3">{tenant.bodyType}</p>
              </div>
            </div>

            <h1 className="mt-5 font-display text-[22px] font-semibold tracking-tight text-ink">
              Create your account
            </h1>

            <div className="mt-5 space-y-4">
              <section>
                <Label>Full name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  autoFocus
                />
              </section>
              <section>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </section>
              <section>
                <Label hint="how you're grouped for tallies">{tenant.constituencyLabel}</Label>
                <Input
                  value={constituency}
                  onChange={(e) => setConstituency(e.target.value)}
                  placeholder={`e.g. ${tenant.constituencyLabel} 1`}
                />
              </section>
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              disabled={!canSubmit}
              onClick={() => setDuoOpen(true)}
            >
              Create account
              <ArrowRight size={17} />
            </Button>
            <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
              <ShieldCheck size={13} className="text-ok" />
              Protected by two-factor authentication
            </p>
          </div>
        )}
      </div>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={onVerified}
        title="Confirm sign-up"
        context={name ? `Verifying ${name}` : undefined}
      />
    </div>
  );
}
