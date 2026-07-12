import { redirect, notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { PAGE_MODULES } from "@/modules/registry";

/**
 * /t/[tenant] → redirect to the first enabled page-module.
 * E.g. /t/xaviers → /t/xaviers/proposals
 */
export default async function TenantIndexPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  const firstPage = PAGE_MODULES.find((m) => tenant.features.includes(m.id));
  if (!firstPage) notFound();

  redirect(`/t/${slug}/${firstPage.id}`);
}
