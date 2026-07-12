import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { proposals } from "@/lib/data";
import { castVote } from "@/lib/votes";
import { maybeCreatePipelineRoom } from "@/lib/cisco/webex-pipeline";

/**
 * POST /api/t/[tenant]/proposals/[id]/vote
 *
 * This is the in-app Endorse button's real backend — previously it only
 * did a local `setState` in detail-client.tsx and nothing was persisted.
 * It now:
 *   1. casts a real vote (one-person-one-vote enforced by the DB, same
 *      helper the Webex ballot card already used),
 *   2. re-reads the proposal's real (post-seed) vote count,
 *   3. hands off to the vote-threshold Webex integration, which creates a
 *      Webex space the moment that count crosses the threshold.
 *
 * "One person" is a per-browser identity cookie for now (Duo isn't wired
 * up yet — see AUDIT_AND_WEBEX_NOTES.md) — good enough to demo one vote
 * per member and to let the threshold be crossed by real, distinct votes.
 */

function voterCookieName(tenantSlug: string) {
  return `cin_voter_${tenantSlug}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string; id: string }> },
) {
  const { tenant: tenantSlug, id } = await params;

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Unknown tenant" }, { status: 404 });

  const existing = await proposals.get(tenantSlug, id);
  if (!existing) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });

  const jar = await cookies();
  const cookieName = voterCookieName(tenantSlug);
  let voterId = jar.get(cookieName)?.value;
  const isNewVoter = !voterId;
  if (!voterId) voterId = `web-${crypto.randomUUID()}`;

  let displayName = "CIN member";
  try {
    const body = await req.json();
    if (typeof body?.name === "string" && body.name.trim()) {
      displayName = body.name.trim();
    }
  } catch {
    // no JSON body sent — fine, use the default name
  }

  const result = await castVote({ tenantSlug, proposalId: id, userId: voterId, displayName });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  let webex: Awaited<ReturnType<typeof maybeCreatePipelineRoom>> | null = null;
  if (!result.alreadyVoted) {
    const realVoteCount = await proposals.realVoteCount(tenantSlug, id);
    const afterVote = await proposals.get(tenantSlug, id);
    if (afterVote) {
      try {
        webex = await maybeCreatePipelineRoom({ tenant, proposal: afterVote, realVoteCount });
      } catch (err) {
        console.error("POST vote — maybeCreatePipelineRoom error:", err);
      }
    }
  }

  const finalProposal = await proposals.get(tenantSlug, id);

  const res = NextResponse.json({
    proposal: finalProposal,
    alreadyVoted: result.alreadyVoted,
    webex,
  });

  if (isNewVoter) {
    res.cookies.set(cookieName, voterId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  return res;
}
