import { notFound } from "next/navigation";
import { getTenant } from "@/lib/tenant";
import { ProposalDetailClient } from "./detail-client";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ tenant: string; id: string }>;
}) {
  const { tenant: slug, id } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) notFound();

  return <ProposalDetailClient tenant={tenant} proposalId={id} />;
}
