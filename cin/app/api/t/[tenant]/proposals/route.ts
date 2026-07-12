import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { proposals } from "@/lib/data";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant } = await params;
  const list = await proposals.list(tenant);
  return NextResponse.json(list);
}

const TITLE_MAX = 140;
const BODY_MAX = 4000;

/**
 * POST /api/t/[tenant]/proposals
 *
 * Backs the "New Proposal" button in the web app — previously the only
 * way a proposal entered the system was over Webex (see
 * app/api/webex/webhook/route.ts). Uses the same per-browser cookie
 * identity the Endorse button already relies on (see the vote route),
 * so a proposal you submit is authored by "you" the same way a vote you
 * cast is "yours" — no separate login system to build.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> },
) {
  const { tenant: tenantSlug } = await params;

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const proposalBody = typeof body?.body === "string" ? body.body.trim() : "";
  const constituency =
    typeof body?.constituency === "string" && body.constituency.trim()
      ? body.constituency.trim()
      : tenant.constituencyLabel;
  const displayName =
    typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "CIN member";

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (title.length > TITLE_MAX)
    return NextResponse.json({ error: `Title must be under ${TITLE_MAX} characters` }, { status: 400 });
  if (!proposalBody || proposalBody.length < 20)
    return NextResponse.json({ error: "Description must be at least 20 characters" }, { status: 400 });
  if (proposalBody.length > BODY_MAX)
    return NextResponse.json({ error: `Description must be under ${BODY_MAX} characters` }, { status: 400 });

  let budgetAsk: number | null = null;
  if (tenant.features.includes("budgeting") && body?.budgetAsk !== undefined && body?.budgetAsk !== null && body?.budgetAsk !== "") {
    const n = Number(body.budgetAsk);
    if (Number.isFinite(n) && n > 0) budgetAsk = Math.round(n);
  }

  const jar = await cookies();
  const cookieName = `cin_voter_${tenantSlug}`;
  let authorId = jar.get(cookieName)?.value;
  const isNewVoter = !authorId;
  if (!authorId) authorId = `web-${crypto.randomUUID()}`;

  try {
    const created = await proposals.createFromWeb({
      tenantSlug,
      title,
      body: proposalBody,
      authorId,
      authorName: displayName,
      constituency,
      budgetAsk,
    });

    const enriched = await proposals.get(tenantSlug, created.id);

    const res = NextResponse.json({ proposal: enriched ?? created });
    if (isNewVoter) {
      res.cookies.set(cookieName, authorId, {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return res;
  } catch (err: any) {
    console.error("POST proposals error:", err);
    return NextResponse.json({ error: err.message || "Couldn't create the proposal" }, { status: 500 });
  }
}
