import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { MANIFESTS } from "@/modules/registry";
import { ModuleDispatcher } from "./dispatcher";
import { PreviewStub } from "./preview-stub";

/**
 * ★ THE DISPATCHER — this is the whole idea.
 *
 * - Unknown tenant → 404, NEVER a fallback
 * - 'voting' (capability, no page) → 404
 * - Feature OFF for this tenant → this URL does not exist → 404
 * - Preview status → stub page
 * - Live → render the View component
 */
export default async function ModulePage({
  params,
}: {
  params: Promise<{ tenant: string; module: string }>;
}) {
  const { tenant: slug, module } = await params;
  const tenant = await getTenant(slug);

  if (!tenant) notFound();

  const m = MANIFESTS[module];
  if (!m || m.kind !== "page") notFound();
  if (!tenant.features.includes(module)) notFound();

  if (m.status === "preview") {
    return <PreviewStub manifest={m} tenant={tenant} />;
  }

  return <ModuleDispatcher module={module} tenant={tenant} />;
}

/** Fully dynamic — do not try to pre-render tenants. */
export function generateStaticParams() {
  return [];
}
