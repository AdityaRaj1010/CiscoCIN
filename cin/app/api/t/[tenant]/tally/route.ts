import { NextResponse } from "next/server";
import { getTenant } from "@/lib/tenant";
import { tally } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: slug } = await params;
  const tenant = await getTenant(slug);
  if (!tenant) return NextResponse.json({ error: "unknown tenant" }, { status: 404 });

  const data = await tally.get(tenant);
  return NextResponse.json(data);
}
