import Link from "next/link";
import { ArrowRight, Shield, Activity, Users, Layers, CheckCircle2, ShieldCheck, UserPlus } from "lucide-react";
import { listTenants } from "@/lib/tenant";

export default async function HomePage() {
  const tenants = await listTenants();

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between">
      {/* Top OS System Bar */}
      <header className="border-b border-line bg-surface px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">
              CIN
            </span>
            <span className="font-display font-semibold text-lg tracking-tight text-ink">
              Civic Intelligence Network
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center text-xs font-medium text-ink-2 hover:text-ink"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary-strong"
            >
              <UserPlus size={13} />
              Client Sign Up
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
            >
              <ShieldCheck size={13} />
              Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-mono text-ink-2 mb-6 shadow-sm">
            <Shield size={14} className="text-primary" />
            <span>MFA-verified participatory democracy plane</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold tracking-tight text-ink leading-[1.1]">
            Multi-tenant civic participation & decision infrastructure.
          </h1>
          <p className="mt-6 text-lg text-ink-2 leading-relaxed font-sans max-w-2xl">
            CIN (Civic Intelligence Network) routes community proposals through a 4-stage trust filter, verified by one-person-one-vote MFA ballots and live participatory budgeting.
          </p>

          {/* Two entry points: client or admin */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/signup">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-app)] bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]">
                <UserPlus size={17} />
                Continue as a Client
                <ArrowRight size={17} />
              </span>
            </Link>
            <Link href="/admin/login">
              <span className="inline-flex items-center gap-2 rounded-[var(--radius-app)] border border-line-strong bg-surface px-6 py-3 text-[15px] font-medium text-ink transition-colors hover:bg-surface-2">
                <ShieldCheck size={17} />
                Continue as Administrator
              </span>
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-ink-3">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Tenant Directory */}
        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 mb-8">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                Active Tenants
              </h2>
              <p className="text-sm text-ink-3 mt-0.5">
                Each tenant operates in complete isolation with distinct branding, governance rules, and feature flags.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/provision"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-transform hover:scale-105"
              >
                + Provision New Tenant
              </Link>
              <span className="font-mono text-xs text-ink-3 bg-surface-2 px-2.5 py-1 rounded border border-line hidden sm:inline-block">
                URL-isolated plane (/t/[tenant]/*)
              </span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {tenants.map((t) => (
              <Link
                key={t.slug}
                href={`/t/${t.slug}/proposals`}
                className="group relative flex flex-col justify-between rounded-2xl border border-line bg-surface p-6 transition-all duration-200 hover:border-line-strong hover:shadow-lg"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <span
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl font-display text-lg font-bold shadow-sm"
                        style={{
                          background: t.branding.primaryColor,
                          color: t.branding.primaryForeground,
                        }}
                      >
                        {t.branding.logoText}
                      </span>
                      <div>
                        <h3 className="font-display text-lg font-semibold text-ink group-hover:text-primary transition-colors">
                          {t.name}
                        </h3>
                        <p className="font-mono text-xs text-ink-3 uppercase tracking-wider">
                          {t.sector} · {t.bodyType}
                        </p>
                      </div>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-2 text-ink-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <ArrowRight size={16} />
                    </span>
                  </div>

                  <div className="mt-6 pt-5 border-t border-line flex flex-wrap gap-2">
                    {t.features.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] text-ink-2 border border-line"
                      >
                        <CheckCircle2 size={11} className="text-ok" />
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-ink-3 font-mono">
                  <span>Constituency: {t.constituencyLabel}</span>
                  <span className="text-primary font-sans font-medium group-hover:underline">
                    Enter Portal →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Architecture Highlights */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3 pt-12 border-t border-line">
          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-soft text-primary-strong mb-4">
              <Layers size={20} />
            </div>
            <h4 className="font-display font-semibold text-ink">Edge Tenant Resolution</h4>
            <p className="mt-1.5 text-xs text-ink-2 leading-relaxed">
              Tenants are resolved directly from URL slugs and subdomains via Next.js middleware, guaranteeing strict isolation and 404 behavior for disabled modules.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent-soft text-accent-foreground mb-4">
              <Users size={20} />
            </div>
            <h4 className="font-display font-semibold text-ink">Duo MFA Verification</h4>
            <p className="mt-1.5 text-xs text-ink-2 leading-relaxed">
              Every vote requires explicit cryptographic verification through Duo push notifications, preventing duplicate voting and ensuring election integrity.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface p-5">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-ink mb-4">
              <Activity size={20} />
            </div>
            <h4 className="font-display font-semibold text-ink">Realtime Tally & Pool</h4>
            <p className="mt-1.5 text-xs text-ink-2 leading-relaxed">
              Live constituency support breakdown and participatory budgeting pool allocation calculated dynamically as proposals pass verification thresholds.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface px-6 py-6 text-center text-xs font-mono text-ink-3">
        CIN — Civic Intelligence Network · Built on St. Xavier&apos;s & Devgaon Pilots
      </footer>
    </div>
  );
}
