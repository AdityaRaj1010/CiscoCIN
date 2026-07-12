import type { ModuleManifest } from "@/modules/types";
import type { Tenant } from "@/lib/tenant";

/**
 * Rendered for modules with status: 'preview'.
 * Shows the module name with a "SOON" badge — matches the existing
 * provisioner UI's preview chip style.
 */
export function PreviewStub({
  manifest,
  tenant,
}: {
  manifest: ModuleManifest;
  tenant: Tenant;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <span className="mb-4 rounded-full bg-accent-soft px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
        Coming soon
      </span>
      <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
        {manifest.label}
      </h1>
      <p className="mt-2 max-w-md text-[15px] text-ink-2">{manifest.blurb}</p>
      <p className="mt-6 font-mono text-[11px] text-ink-3">
        {tenant.name} · {manifest.id}
      </p>
    </div>
  );
}
