import { NextResponse } from "next/server";
import { proposals } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant, id } = await params;
  const p = await proposals.get(tenant, id);
  if (!p) return NextResponse.json(null, { status: 404 });
  return NextResponse.json(p);
}
