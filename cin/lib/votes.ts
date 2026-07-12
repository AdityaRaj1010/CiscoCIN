/**
 * lib/votes.ts
 *
 * Casting a vote is shared by every entry point (Webex ballot today,
 * an in-app Endorse button once that's wired to Duo). One person, one
 * vote is enforced by the database's unique index, not here — this just
 * surfaces that as a typed result instead of a raw Postgres error.
 */
import { getDb } from "@/lib/db";

export type CastVoteResult =
  | { ok: true; alreadyVoted: false }
  | { ok: true; alreadyVoted: true }
  | { ok: false; error: string };

/**
 * Ensure a lightweight user row exists for a voter we've never seen before
 * (e.g. a Webex participant who isn't in the seeded roster). Real identity
 * still comes from Duo in Phase 5 — this just satisfies the FK so the vote
 * can be recorded and counted today.
 */
export async function ensureWebexUser(
  sql: NonNullable<ReturnType<typeof getDb>>,
  tenantSlug: string,
  userId: string,
  displayName: string,
) {
  return ensureUser(sql, tenantSlug, userId, displayName);
}

async function ensureUser(
  sql: NonNullable<ReturnType<typeof getDb>>,
  tenantSlug: string,
  userId: string,
  displayName: string,
) {
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";

  await sql`
    INSERT INTO users (id, tenant_slug, name, role, constituency, avatar_initials)
    VALUES (${userId}, ${tenantSlug}, ${displayName}, 'Webex', 'Webex', ${initials})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function castVote(params: {
  tenantSlug: string;
  proposalId: string;
  userId: string;
  displayName: string;
}): Promise<CastVoteResult> {
  const { tenantSlug, proposalId, userId, displayName } = params;
  const sql = getDb();
  if (!sql) return { ok: false, error: "DATABASE_URL not configured" };

  try {
    await ensureUser(sql, tenantSlug, userId, displayName);
    await sql`
      INSERT INTO votes (tenant_slug, proposal_id, user_id)
      VALUES (${tenantSlug}, ${proposalId}, ${userId})
    `;
    return { ok: true, alreadyVoted: false };
  } catch (err: any) {
    if (err.code === "23505") {
      return { ok: true, alreadyVoted: true };
    }
    console.error("castVote error:", err);
    return { ok: false, error: err.message || "Database error" };
  }
}
