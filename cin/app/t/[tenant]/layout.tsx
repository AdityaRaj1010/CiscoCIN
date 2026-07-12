import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { PAGE_MODULES } from "@/modules/registry";
import { LanguageProvider } from "@/context/LanguageContext";
import { TenantShell } from "@/components/tenant-shell";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  // Build nav items from PAGE_MODULES ∩ tenant.features
  const navItems = PAGE_MODULES
    .filter((m) => tenant.features.includes(m.id))
    .map((m) => ({
      id: m.id,
      label: m.label,
      href: `/t/${tenant.slug}/${m.id}`,
    }));

  const b = tenant.branding;
  const themeVars = {
    "--primary": b.primaryColor,
    "--primary-strong": b.primaryStrong,
    "--primary-soft": b.primarySoft,
    "--primary-foreground": b.primaryForeground,
    "--accent": b.accentColor,
    "--accent-soft": b.accentSoft,
    "--accent-foreground": b.accentForeground,
  } as React.CSSProperties;

  return (
    <div style={themeVars}>
      <LanguageProvider>
        <TenantShell tenant={tenant} navItems={navItems}>
          {children}
        </TenantShell>
      </LanguageProvider>
    </div>
  );
}
