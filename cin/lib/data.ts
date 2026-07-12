/**
 * CIN data layer — replaces src/api/index.ts.
 * Same function names and signatures.
 *
 * Reads go through Postgres when DATABASE_URL is configured (see lib/db.ts),
 * falling back to the hardcoded seed below otherwise — the same pattern
 * lib/tenant.ts uses. This keeps the app runnable with zero config while
 * making real, Webex-sourced data show up the moment a database is wired up.
 */
import { getDb } from "@/lib/db";
import { webexSpaceDeepLink } from "@/lib/cisco/webex";
import { ensureWebexUser } from "@/lib/votes";
import crypto from "node:crypto";
import type { Tenant } from "@/lib/tenant";
import type { StageId } from "@/lib/pipeline";

/* -------------------------------- types -------------------------------- */

export interface User {
  id: string;
  tenantSlug: string;
  name: string;
  role: string;
  constituency: string;
  avatarInitials: string;
}

export interface Proposal {
  id: string;
  tenantSlug: string;
  title: string;
  summary: string;
  body: string;
  authorId: string;
  authorName: string;
  constituency: string;
  stage: StageId;
  createdAt: string;
  seedVotesByConstituency: Record<string, number>;
  budgetAsk?: number;
  tags: string[];
  source?: "web" | "webex";
  webexMessageId?: string | null;
  /** Set once the vote-threshold integration creates a room for this proposal. */
  webexRoomId?: string | null;
  webexRoomCreatedAt?: string | null;
  /** Real outcome evidence — set only by proposals.verify(), never assumed. */
  verificationNote?: string | null;
  verificationPhoto?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export interface ProposalView extends Proposal {
  votes: number;
  votesByConstituency: Record<string, number>;
  votedByCurrentUser: boolean;
  /** Deep link into the auto-created Webex space, derived from webexRoomId. Null until a room exists. */
  webexRoomUrl?: string | null;
}

export interface TallyGroup {
  constituency: string;
  votes: number;
}

export interface TallyData {
  constituencyLabel: string;
  totalVotes: number;
  totalProposals: number;
  groups: TallyGroup[];
  ranked: ProposalView[];
}

/* -------------------------------- seed users ----------------------------- */

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function u(
  id: string,
  tenantSlug: string,
  name: string,
  role: string,
  constituency: string,
): User {
  return { id, tenantSlug, name, role, constituency, avatarInitials: initials(name) };
}

const SEED_USERS: User[] = [
  // St. Xavier's College
  u("xa-u1", "xaviers", "Aditi Rao", "3rd yr · Computer Science", "Computer Science"),
  u("xa-u2", "xaviers", "Kabir Menon", "Union President", "Economics"),
  u("xa-u3", "xaviers", "Sara Fernandes", "2nd yr · Mass Media", "Mass Media"),
  u("xa-u4", "xaviers", "Rohan Iyer", "4th yr · Physics", "Physics"),
  // Devgaon Panchayat
  u("dv-u1", "devgaon", "Sunita Devi", "Ward member", "Ward 3 · Rampara"),
  u("dv-u2", "devgaon", "Ramesh Patil", "Sarpanch", "Ward 1 · Devgaon Khurd"),
  u("dv-u3", "devgaon", "Imran Shaikh", "Resident", "Ward 5 · Naya Basti"),
  u("dv-u4", "devgaon", "Lakshmi Naidu", "Resident", "Ward 2 · Talav Side"),
];

/* ----------------------------- seed proposals ---------------------------- */

const SEED_PROPOSALS: Proposal[] = [
  // ─── St. Xavier's College ───
  {
    id: "xa-p1",
    tenantSlug: "xaviers",
    title: "Extend the central library to 24 hours during exams",
    summary: "Keep the main reading hall open overnight for the three weeks around semester finals.",
    body: "During finals the 8pm closing pushes students to crowded hostel common rooms. A rotating security shift and existing card-access already cover the building after hours. We propose a two-week pilot for the winter finals, with a headcount review before making it permanent.",
    authorId: "xa-u1",
    authorName: "Aditi Rao",
    constituency: "Computer Science",
    stage: "trigger",
    createdAt: "2026-06-18",
    seedVotesByConstituency: { "Computer Science": 84, Economics: 41, "Mass Media": 33, Physics: 52, Commerce: 28 },
    budgetAsk: 120000,
    tags: ["academics", "facilities"],
  },
  {
    id: "xa-p2",
    tenantSlug: "xaviers",
    title: "On-campus counsellor available every weekday",
    summary: "Move from the current twice-a-week visiting counsellor to a full-time presence.",
    body: "Wait times for the visiting counsellor have stretched past two weeks. A full-time counsellor, funded partly from the wellness budget, would cut that to same-week appointments and support exam-season demand.",
    authorId: "xa-u3",
    authorName: "Sara Fernandes",
    constituency: "Mass Media",
    stage: "trust",
    createdAt: "2026-06-25",
    seedVotesByConstituency: { "Computer Science": 47, Economics: 38, "Mass Media": 66, Physics: 29, Commerce: 44 },
    budgetAsk: 480000,
    tags: ["wellbeing"],
  },
  {
    id: "xa-p3",
    tenantSlug: "xaviers",
    title: "Reusable steel plates at every canteen counter",
    summary: "Phase out disposable plates and cut the campus's single-use waste.",
    body: "The canteen goes through thousands of disposable plates a week. A one-time investment in steel crockery and a dishwashing station pays back within a semester and removes most of our cafeteria waste.",
    authorId: "xa-u4",
    authorName: "Rohan Iyer",
    constituency: "Physics",
    stage: "notice",
    createdAt: "2026-07-01",
    seedVotesByConstituency: { "Computer Science": 22, Economics: 19, "Mass Media": 24, Physics: 31, Commerce: 17 },
    budgetAsk: 90000,
    tags: ["sustainability", "canteen"],
  },
  {
    id: "xa-p4",
    tenantSlug: "xaviers",
    title: "Split the annual fest budget with a student-run vote",
    summary: "Let departments allocate a share of the fest budget via participatory budgeting.",
    body: "Instead of the organising committee deciding the whole fest budget, put 30% of it to a participatory vote across departments — headliner, workshops, sports, or socials. Departments propose line items and everyone allocates points.",
    authorId: "xa-u2",
    authorName: "Kabir Menon",
    constituency: "Economics",
    stage: "notice",
    createdAt: "2026-07-03",
    seedVotesByConstituency: { "Computer Science": 35, Economics: 58, "Mass Media": 40, Physics: 26, Commerce: 39 },
    budgetAsk: 750000,
    tags: ["budget", "events"],
  },
  {
    id: "xa-p5",
    tenantSlug: "xaviers",
    title: "Campus-wide Wi-Fi upgrade for the hostel blocks",
    summary: "The hostel network drops every evening — upgrade the access points.",
    body: "Evening peak load makes the hostel Wi-Fi unusable for anything but messaging. An audit of dead zones plus new access points in the two older blocks would fix the worst of it.",
    authorId: "xa-u1",
    authorName: "Aditi Rao",
    constituency: "Computer Science",
    stage: "trigger",
    createdAt: "2026-05-30",
    seedVotesByConstituency: { "Computer Science": 96, Economics: 52, "Mass Media": 48, Physics: 61, Commerce: 45 },
    budgetAsk: 640000,
    tags: ["infrastructure"],
  },
  {
    id: "xa-p6",
    tenantSlug: "xaviers",
    title: "Gender-neutral washrooms in the arts building",
    summary: "Convert two single-stall washrooms to gender-neutral in the arts wing.",
    body: "A small, low-cost signage-and-fixtures change in the arts building's existing single-stall washrooms. Reviewed with facilities; no structural work required.",
    authorId: "xa-u3",
    authorName: "Sara Fernandes",
    constituency: "Mass Media",
    stage: "trust",
    createdAt: "2026-06-28",
    seedVotesByConstituency: { "Computer Science": 31, Economics: 27, "Mass Media": 43, Physics: 22, Commerce: 20 },
    budgetAsk: 60000,
    tags: ["inclusion", "facilities"],
  },
  {
    id: "xa-p7",
    tenantSlug: "xaviers",
    title: "Weekend shuttle to the metro station",
    summary: "A Saturday shuttle loop from campus to the nearest metro line.",
    body: "Students without vehicles are stranded on weekends. A single shuttle running a morning and evening loop to the metro would cover most of the demand at a modest per-semester cost.",
    authorId: "xa-u4",
    authorName: "Rohan Iyer",
    constituency: "Physics",
    stage: "trigger",
    createdAt: "2026-06-12",
    seedVotesByConstituency: { "Computer Science": 54, Economics: 49, "Mass Media": 37, Physics: 58, Commerce: 41 },
    budgetAsk: 300000,
    tags: ["transport"],
  },
  // ─── Devgaon Panchayat ───
  {
    id: "dv-p1",
    tenantSlug: "devgaon",
    title: "Streetlights on the Rampara approach road",
    summary: "The 800m approach to Rampara has no lighting — install solar poles.",
    body: "The unlit stretch between the main road and Rampara is unsafe after dark, especially for women and schoolchildren returning in winter. Solar poles avoid new wiring and cut recurring electricity cost.",
    authorId: "dv-u1",
    authorName: "Sunita Devi",
    constituency: "Ward 3 · Rampara",
    stage: "trigger",
    createdAt: "2026-06-20",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 38, "Ward 2 · Talav Side": 44, "Ward 3 · Rampara": 91, "Ward 4 · Bazaar": 29, "Ward 5 · Naya Basti": 52 },
    tags: ["safety", "infrastructure"],
  },
  {
    id: "dv-p2",
    tenantSlug: "devgaon",
    title: "Repair the Talav Side drainage before monsoon",
    summary: "Clear and reline the drain that floods the market lane every year.",
    body: "Every monsoon the Talav Side lane floods because the drain is silted and broken in two sections. Desilting and relining before the rains would prevent the annual waterlogging that shuts the market.",
    authorId: "dv-u4",
    authorName: "Lakshmi Naidu",
    constituency: "Ward 2 · Talav Side",
    stage: "trust",
    createdAt: "2026-06-27",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 41, "Ward 2 · Talav Side": 78, "Ward 3 · Rampara": 33, "Ward 4 · Bazaar": 47, "Ward 5 · Naya Basti": 36 },
    tags: ["drainage", "monsoon"],
  },
  {
    id: "dv-p3",
    tenantSlug: "devgaon",
    title: "Weekly mobile health clinic for the outer wards",
    summary: "A visiting clinic one day a week for wards far from the PHC.",
    body: "Residents in Naya Basti and Rampara travel 12km to the primary health centre for routine checkups. A weekly mobile clinic rotating between the outer wards would cover antenatal visits and basic care.",
    authorId: "dv-u3",
    authorName: "Imran Shaikh",
    constituency: "Ward 5 · Naya Basti",
    stage: "notice",
    createdAt: "2026-07-02",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 29, "Ward 2 · Talav Side": 34, "Ward 3 · Rampara": 45, "Ward 4 · Bazaar": 22, "Ward 5 · Naya Basti": 63 },
    tags: ["health"],
  },
  {
    id: "dv-p4",
    tenantSlug: "devgaon",
    title: "Fix the hand pump at the Devgaon Khurd school",
    summary: "The school's only hand pump has been dry for two months.",
    body: "The primary school hand pump failed and children carry water from home. A borewell deepening and new pump head would restore supply. Quotes already collected from two local contractors.",
    authorId: "dv-u2",
    authorName: "Ramesh Patil",
    constituency: "Ward 1 · Devgaon Khurd",
    stage: "trigger",
    createdAt: "2026-05-28",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 72, "Ward 2 · Talav Side": 30, "Ward 3 · Rampara": 26, "Ward 4 · Bazaar": 24, "Ward 5 · Naya Basti": 33 },
    tags: ["water", "school"],
  },
  {
    id: "dv-p5",
    tenantSlug: "devgaon",
    title: "Twice-weekly waste collection in the Bazaar ward",
    summary: "Market waste piles up — add a second collection day.",
    body: "The Bazaar ward generates far more waste than a single weekly pickup can handle, and it spills into the drains. A second collection day and two more bins at the market would keep it clean.",
    authorId: "dv-u1",
    authorName: "Sunita Devi",
    constituency: "Ward 4 · Bazaar",
    stage: "notice",
    createdAt: "2026-07-04",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 21, "Ward 2 · Talav Side": 28, "Ward 3 · Rampara": 19, "Ward 4 · Bazaar": 55, "Ward 5 · Naya Basti": 24 },
    tags: ["sanitation"],
  },
  {
    id: "dv-p6",
    tenantSlug: "devgaon",
    title: "Resurface the Talav–Bazaar connecting road",
    summary: "The 1.2km link road is broken and floods the shortcut to the market.",
    body: "The connecting road between Talav Side and the Bazaar is potholed end to end, and vendors lose a full day's trade when it floods. Resurfacing with a raised camber would fix drainage and access together.",
    authorId: "dv-u4",
    authorName: "Lakshmi Naidu",
    constituency: "Ward 2 · Talav Side",
    stage: "trigger",
    createdAt: "2026-06-15",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 36, "Ward 2 · Talav Side": 61, "Ward 3 · Rampara": 30, "Ward 4 · Bazaar": 58, "Ward 5 · Naya Basti": 27 },
    tags: ["roads"],
  },
  {
    id: "dv-p7",
    tenantSlug: "devgaon",
    title: "Evening adult-literacy classes at the panchayat hall",
    summary: "Use the empty hall for three evening literacy sessions a week.",
    body: "The panchayat hall sits empty after 6pm. Volunteer-run literacy classes three evenings a week would serve adults who missed schooling, with a small honorarium for the teachers.",
    authorId: "dv-u3",
    authorName: "Imran Shaikh",
    constituency: "Ward 5 · Naya Basti",
    stage: "trust",
    createdAt: "2026-06-30",
    seedVotesByConstituency: { "Ward 1 · Devgaon Khurd": 25, "Ward 2 · Talav Side": 31, "Ward 3 · Rampara": 34, "Ward 4 · Bazaar": 23, "Ward 5 · Naya Basti": 49 },
    tags: ["education"],
  },
];

/* ------------------------------ helpers -------------------------------- */


function enrich(p: Proposal, realVotesByConstituency: Record<string, number> = {}): ProposalView {
  const votesByConstituency = { ...p.seedVotesByConstituency };
  for (const [c, n] of Object.entries(realVotesByConstituency)) {
    votesByConstituency[c] = (votesByConstituency[c] ?? 0) + n;
  }
  return {
    ...p,
    source: p.source ?? "web",
    votes: Object.values(votesByConstituency).reduce((a, b) => a + b, 0),
    votesByConstituency,
    votedByCurrentUser: false,
    webexRoomUrl: p.webexRoomId ? webexSpaceDeepLink(p.webexRoomId) : null,
  };
}

/* --------------------------- db row → domain mapping --------------------------- */

function rowToProposal(row: any): Proposal {
  return {
    id: row.id,
    tenantSlug: row.tenant_slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    authorId: row.author_id,
    authorName: row.author_name,
    constituency: row.constituency,
    stage: row.stage,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    seedVotesByConstituency: row.seed_votes_by_constituency || {},
    budgetAsk: row.budget_ask ?? undefined,
    tags: row.tags || [],
    source: row.source ?? "web",
    webexMessageId: row.webex_message_id ?? null,
    webexRoomId: row.webex_room_id ?? null,
    webexRoomCreatedAt:
      row.webex_room_created_at instanceof Date
        ? row.webex_room_created_at.toISOString()
        : row.webex_room_created_at ?? null,
    verificationNote: row.verification_note ?? null,
    verificationPhoto: row.verification_photo ?? null,
    verifiedBy: row.verified_by ?? null,
    verifiedAt:
      row.verified_at instanceof Date ? row.verified_at.toISOString() : row.verified_at ?? null,
  };
}

/** Real (post-seed) votes for a tenant, grouped by proposal id then constituency. */
async function realVoteTotals(
  sql: NonNullable<ReturnType<typeof getDb>>,
  tenantSlug: string,
): Promise<Record<string, Record<string, number>>> {
  const rows = await sql`
    SELECT v.proposal_id, u.constituency, COUNT(*)::int AS n
    FROM votes v
    JOIN users u ON u.id = v.user_id
    WHERE v.tenant_slug = ${tenantSlug}
    GROUP BY v.proposal_id, u.constituency
  `;
  const out: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    out[r.proposal_id] ??= {};
    out[r.proposal_id][r.constituency] = r.n;
  }
  return out;
}

/* ------------------------------ public API ----------------------------- */

export const proposals = {
  async list(tenantSlug: string): Promise<ProposalView[]> {
    const sql = getDb();
    if (sql) {
      try {
        const rows = await sql`SELECT * FROM proposals WHERE tenant_slug = ${tenantSlug}`;
        if (rows.length > 0) {
          const real = await realVoteTotals(sql, tenantSlug);
          return rows.map((row) => enrich(rowToProposal(row), real[row.id]));
        }
      } catch (err) {
        console.error("proposals.list DB query error:", err);
      }
    }
    return SEED_PROPOSALS.filter((p) => p.tenantSlug === tenantSlug).map((p) => enrich(p));
  },

  async get(tenantSlug: string, id: string): Promise<ProposalView | null> {
    const sql = getDb();
    if (sql) {
      try {
        const [row] = await sql`
          SELECT * FROM proposals WHERE tenant_slug = ${tenantSlug} AND id = ${id}
        `;
        if (row) {
          const real = await realVoteTotals(sql, tenantSlug);
          return enrich(rowToProposal(row), real[row.id]);
        }
      } catch (err) {
        console.error("proposals.get DB query error:", err);
      }
    }
    const p = SEED_PROPOSALS.find((x) => x.tenantSlug === tenantSlug && x.id === id);
    return p ? enrich(p) : null;
  },

  /**
   * Cross-tenant lookup by id alone — `proposals.id` is globally unique
   * (it's the table's primary key, not composite with tenant_slug). Used
   * by the Webex webhook to resolve a ballot-card tap's tenant: the
   * card's `proposalId` input is the only thing we need, whether the tap
   * came from a tenant's original inbound room or a room the
   * vote-threshold integration auto-created (see
   * lib/cisco/webex-pipeline.ts) — unlike messages, which still need
   * getTenantByWebexRoom() because there's no proposal to anchor to yet.
   */
  async getById(id: string): Promise<ProposalView | null> {
    const sql = getDb();
    if (sql) {
      try {
        const [row] = await sql`SELECT * FROM proposals WHERE id = ${id}`;
        if (row) {
          const real = await realVoteTotals(sql, row.tenant_slug);
          return enrich(rowToProposal(row), real[row.id]);
        }
      } catch (err) {
        console.error("proposals.getById DB query error:", err);
      }
    }
    const p = SEED_PROPOSALS.find((x) => x.id === id);
    return p ? enrich(p) : null;
  },

  /**
   * Insert a proposal that arrived over Webex. Used by
   * app/api/webex/webhook/route.ts. Returns null (instead of throwing) on a
   * duplicate `webex_message_id` — the webhook can retry delivery, and
   * ingesting the same message twice must be a no-op, not a second proposal.
   */
  async create(params: {
    tenantSlug: string;
    title: string;
    body: string;
    authorId: string;
    authorName: string;
    constituency?: string;
    webexMessageId: string;
  }): Promise<Proposal | null> {
    const sql = getDb();
    if (!sql) throw new Error("DATABASE_URL not configured");

    const id = `wx-${params.webexMessageId.slice(-12)}`;
    const summary = params.body.length > 160 ? `${params.body.slice(0, 157)}...` : params.body;

    try {
      const [row] = await sql`
        INSERT INTO proposals (
          id, tenant_slug, title, summary, body,
          author_id, author_name, constituency, stage,
          seed_votes_by_constituency, tags, source, webex_message_id
        ) VALUES (
          ${id}, ${params.tenantSlug}, ${params.title}, ${summary}, ${params.body},
          ${params.authorId}, ${params.authorName}, ${params.constituency ?? "Webex"}, 'notice',
          '{}'::jsonb, ${[]}, 'webex', ${params.webexMessageId}
        )
        RETURNING *
      `;
      return rowToProposal(row);
    } catch (err: any) {
      if (err.code === "23505") return null; // already ingested this message
      throw err;
    }
  },

  /**
   * Insert a proposal submitted through the web app's "New Proposal"
   * button (see app/api/t/[tenant]/proposals/route.ts, POST). Distinct
   * from create() above because there's no Webex message to dedupe
   * against and the author is whatever browser-cookie identity is voting
   * too (see lib/votes.ts's ensureWebexUser — reused here, it's generic
   * despite the name: it just satisfies the author_id FK for an
   * identity we've never seen before).
   */
  async createFromWeb(params: {
    tenantSlug: string;
    title: string;
    body: string;
    authorId: string;
    authorName: string;
    constituency: string;
    budgetAsk?: number | null;
    tags?: string[];
  }): Promise<Proposal> {
    const sql = getDb();
    if (!sql) throw new Error("DATABASE_URL not configured");

    await ensureWebexUser(sql, params.tenantSlug, params.authorId, params.authorName);

    const id = `p-${crypto.randomUUID().slice(0, 8)}`;
    const summary = params.body.length > 160 ? `${params.body.slice(0, 157)}...` : params.body;

    const [row] = await sql`
      INSERT INTO proposals (
        id, tenant_slug, title, summary, body,
        author_id, author_name, constituency, stage,
        seed_votes_by_constituency, budget_ask, tags, source
      ) VALUES (
        ${id}, ${params.tenantSlug}, ${params.title}, ${summary}, ${params.body},
        ${params.authorId}, ${params.authorName}, ${params.constituency}, 'notice',
        '{}'::jsonb, ${params.budgetAsk ?? null}, ${params.tags ?? []}, 'web'
      )
      RETURNING *
    `;
    return rowToProposal(row);
  },

  /**
   * Real (post-seed) vote count for a single proposal — this is what the
   * vote-threshold Webex integration checks, deliberately ignoring the
   * seed baseline used for the demo tally numbers so the threshold means
   * "N real votes cast", not "N including the pre-loaded story".
   */
  async realVoteCount(tenantSlug: string, id: string): Promise<number> {
    const sql = getDb();
    if (!sql) return 0;
    const [row] = await sql`
      SELECT COUNT(*)::int AS n FROM votes
      WHERE tenant_slug = ${tenantSlug} AND proposal_id = ${id}
    `;
    return row?.n ?? 0;
  },

  /**
   * Records that a Webex space was created for this proposal (the
   * vote-threshold integration — see lib/cisco/webex-pipeline.ts) and
   * advances it to the "trigger" pipeline stage, since a room being
   * created *is* "routed to the body that can act". Guarded by
   * `webex_room_id IS NULL` so this is safe to call more than once —
   * only the first caller wins, matching the unique index on the column.
   */
  async attachWebexRoom(tenantSlug: string, id: string, roomId: string): Promise<Proposal | null> {
    const sql = getDb();
    if (!sql) throw new Error("DATABASE_URL not configured");
    const [row] = await sql`
      UPDATE proposals
      SET webex_room_id = ${roomId},
          webex_room_created_at = now(),
          stage = CASE WHEN stage IN ('notice', 'trust') THEN 'trigger' ELSE stage END
      WHERE tenant_slug = ${tenantSlug} AND id = ${id} AND webex_room_id IS NULL
      RETURNING *
    `;
    return row ? rowToProposal(row) : null;
  },

  /**
   * Records real proof that a proposal's outcome happened — a photo
   * (required) and an optional note — and only then moves it to the
   * 'verification' stage. This is what actually backs the pipeline's
   * claim ("Outcome recorded and verified on the transparency ledger");
   * before this existed nothing did.
   *
   * Guarded by `stage = 'trigger'` so a proposal can only be verified
   * once it's actually been routed to the body that can act on it, and
   * so this can't silently re-run on an already-verified proposal —
   * returns null in both cases (not the right stage, or already done).
   */
  async verify(
    tenantSlug: string,
    id: string,
    params: { photo: string; note?: string | null; verifiedBy: string },
  ): Promise<Proposal | null> {
    const sql = getDb();
    if (!sql) throw new Error("DATABASE_URL not configured");
    const [row] = await sql`
      UPDATE proposals
      SET stage = 'verification',
          verification_photo = ${params.photo},
          verification_note = ${params.note ?? null},
          verified_by = ${params.verifiedBy},
          verified_at = now()
      WHERE tenant_slug = ${tenantSlug} AND id = ${id} AND stage = 'trigger'
      RETURNING *
    `;
    return row ? rowToProposal(row) : null;
  },
};

export const tally = {
  async get(tenant: Tenant): Promise<TallyData> {
    const list = await proposals.list(tenant.slug);
    const groupTotals: Record<string, number> = {};
    for (const p of list) {
      for (const [c, n] of Object.entries(p.votesByConstituency)) {
        groupTotals[c] = (groupTotals[c] ?? 0) + n;
      }
    }
    const groups = Object.entries(groupTotals)
      .map(([constituency, votes]) => ({ constituency, votes }))
      .sort((a, b) => b.votes - a.votes);
    const ranked = [...list].sort((a, b) => b.votes - a.votes);
    return {
      constituencyLabel: tenant.constituencyLabel,
      totalVotes: list.reduce((sum, p) => sum + p.votes, 0),
      totalProposals: list.length,
      groups,
      ranked,
    };
  },
};

export const auth = {
  async usersForTenant(tenantSlug: string): Promise<User[]> {
    const sql = getDb();
    if (sql) {
      try {
        const rows = await sql`SELECT * FROM users WHERE tenant_slug = ${tenantSlug}`;
        if (rows.length > 0) {
          return rows.map((row) => ({
            id: row.id,
            tenantSlug: row.tenant_slug,
            name: row.name,
            role: row.role,
            constituency: row.constituency,
            avatarInitials: row.avatar_initials,
          }));
        }
      } catch (err) {
        console.error("auth.usersForTenant DB query error:", err);
      }
    }
    return SEED_USERS.filter((u) => u.tenantSlug === tenantSlug);
  },
};
