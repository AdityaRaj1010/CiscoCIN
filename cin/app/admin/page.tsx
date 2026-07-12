import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { listTenants } from "@/lib/tenant";
import { AdminSignOut } from "./sign-out";

/**
 * /admin — the platform admin console. Gated by the cin_admin cookie set
 * in /admin/login's mock Duo flow. This is the same "Active Tenants"
 * directory that used to be the entire home page — it hasn't changed,
 * just moved behind the admin fork so the home page can offer both
 * "client" and "admin" entry points, per the request.
 */
export default async function AdminConsolePage() {
  const jar = await cookies();
  if (jar.get("cin_admin")?.value !== "1") {
    redirect("/admin/login");
  }

  const tenants = await listTenants();

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-surface px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground font-display font-bold text-sm">
              CIN
            </span>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-lg tracking-tight text-ink">
                Admin console
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 font-mono text-[10.5px] font-medium text-primary-strong">
                <ShieldCheck size={11} />
                verified
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-xs font-medium text-ink-2 hover:text-ink">
              Home
            </Link>
            <AdminSignOut />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-4 mb-8">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Active Tenants</h1>
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
      </main>
    </div>
  );
}
