import { delay, slugify } from "@/lib/utils";
import type { Tenant } from "@/config/tenants";
import type { Sector } from "@/config/modules";
import {
  SEED_PROPOSALS,
  seedTotal,
  type Proposal,
} from "@/api/mock/proposals";
import { SEED_USERS, type User } from "@/api/mock/users";
import {
  addProvisionedProposals,
  addProvisionedUsers,
  addTenant,
  getProvisionedProposals,
  getProvisionedUsers,
  getSession,
  getTenants,
  getVotes,
  hasVoted,
  recordVote,
  setSession,
  type Session,
} from "@/lib/store";
import { initials } from "@/lib/utils";

/**
 * The ONLY seam between the UI and its data. Everything returns a Promise so a
 * real Supabase/Flask client can replace these bodies without the screens
 * changing. Reads come from the seed modules; writes go through the localStorage
 * store. Every query is scoped by tenantId — mirroring row-level tenant
 * isolation on a real backend.
 */

/** A proposal with vote counts merged in (seed baseline + cast votes). */
export interface ProposalView extends Proposal {
  votes: number;
  votesByConstituency: Record<string, number>;
  votedByCurrentUser: boolean;
}

function allUsers(): User[] {
  return [...SEED_USERS, ...getProvisionedUsers()];
}

function allProposals(): Proposal[] {
  return [...SEED_PROPOSALS, ...getProvisionedProposals()];
}

function userById(id: string): User | undefined {
  return allUsers().find((u) => u.id === id);
}

function enrich(p: Proposal, currentUserId?: string): ProposalView {
  const recorded = getVotes()[p.tenantId]?.[p.id] ?? [];
  const votesByConstituency: Record<string, number> = {
    ...p.seedVotesByConstituency,
  };
  for (const uid of recorded) {
    const c = userById(uid)?.constituency ?? "Other";
    votesByConstituency[c] = (votesByConstituency[c] ?? 0) + 1;
  }
  return {
    ...p,
    votes: seedTotal(p) + recorded.length,
    votesByConstituency,
    votedByCurrentUser: currentUserId
      ? recorded.includes(currentUserId)
      : false,
  };
}

/* -------------------------------- auth ----------------------------- */

export const auth = {
  usersForTenant(tenantId: string): Promise<User[]> {
    return delay(allUsers().filter((u) => u.tenantId === tenantId));
  },
  currentSession(): Promise<Session | null> {
    return delay(getSession(), 0);
  },
  currentUser(): Promise<User | null> {
    const s = getSession();
    return delay(s ? (userById(s.userId) ?? null) : null, 0);
  },
  login(tenantId: string, userId: string): Promise<Session> {
    const session = { tenantId, userId };
    setSession(session);
    return delay(session, 400);
  },
  logout(): Promise<void> {
    setSession(null);
    return delay(undefined, 0);
  },
};

/* ------------------------------ tenants ---------------------------- */

export interface CreateTenantInput {
  name: string;
  kind: string;
  sector: Sector;
  constituencyLabel: string;
  primaryColor: string;
  accentColor: string;
  features: string[];
}

export const tenants = {
  list(): Promise<Tenant[]> {
    return delay(getTenants());
  },
  create(input: CreateTenantInput): Promise<Tenant> {
    const id = uniqueTenantId(input.name);
    const tenant: Tenant = {
      id,
      name: input.name,
      kind: input.kind || "Assembly",
      sector: input.sector,
      constituencyLabel: input.constituencyLabel || "Group",
      branding: {
        logoText: deriveMark(input.name),
        primaryColor: input.primaryColor,
        primaryStrong: shade(input.primaryColor, -0.14),
        primarySoft: tint(input.primaryColor, 0.88),
        primaryForeground: "#ffffff",
        accentColor: input.accentColor,
        accentSoft: tint(input.accentColor, 0.85),
        accentForeground: "#241405",
      },
      features: input.features,
      seed: false,
    };
    addTenant(tenant);
    seedNewTenant(tenant);
    return delay(tenant, 500);
  },
};

/**
 * Give a freshly provisioned tenant just enough content to be walkable: three
 * demo accounts across three constituencies and two starter proposals. This is
 * what makes "Create" land — you can immediately log in and vote.
 */
function seedNewTenant(t: Tenant): void {
  const label = t.constituencyLabel;
  const groups = [`${label} 1`, `${label} 2`, `${label} 3`];
  const roles =
    t.sector === "government"
      ? ["Chairperson", "Member", "Resident"]
      : t.sector === "ngo"
        ? ["Coordinator", "Volunteer", "Member"]
        : ["President", "Representative", "Member"];
  const names = ["Asha Kumar", "Vikram Shah", "Neha Gupta"];

  const users: User[] = names.map((name, i) => ({
    id: `${t.id}-u${i + 1}`,
    tenantId: t.id,
    name,
    role: roles[i],
    constituency: groups[i],
    avatarInitials: initials(name),
  }));
  addProvisionedUsers(users);

  const canBudget = t.features.includes("participatory_budgeting");
  const starters: Proposal[] = [
    {
      id: `${t.id}-p1`,
      tenantId: t.id,
      title: "Publish a monthly open agenda before every meeting",
      summary:
        "Share the agenda and supporting documents a week ahead so members can prepare.",
      body: "Decisions land better when everyone has read the same material. Publishing the agenda and documents a week before each meeting gives members time to consult their constituency and come ready to decide.",
      authorId: users[0].id,
      authorName: users[0].name,
      constituency: groups[0],
      stage: "notice",
      createdAt: t.seed ? "2026-07-01" : "2026-07-08",
      seedVotesByConstituency: { [groups[0]]: 12, [groups[1]]: 7, [groups[2]]: 9 },
      budgetAsk: canBudget ? 40000 : undefined,
      tags: ["transparency"],
    },
    {
      id: `${t.id}-p2`,
      tenantId: t.id,
      title: "Set up a shared noticeboard for community requests",
      summary: "One place to raise, track, and close everyday requests.",
      body: "Right now requests scatter across messages and calls. A single shared noticeboard where anyone can raise an item and watch it move to resolution would cut the follow-up churn.",
      authorId: users[1].id,
      authorName: users[1].name,
      constituency: groups[1],
      stage: "trust",
      createdAt: t.seed ? "2026-07-02" : "2026-07-09",
      seedVotesByConstituency: { [groups[0]]: 5, [groups[1]]: 14, [groups[2]]: 6 },
      budgetAsk: canBudget ? 25000 : undefined,
      tags: ["community"],
    },
  ];
  addProvisionedProposals(starters);
}

function uniqueTenantId(name: string): string {
  const base = slugify(name) || "tenant";
  const existing = new Set(getTenants().map((t) => t.id));
  if (!existing.has(base)) return base;
  let i = 2;
  while (existing.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

function deriveMark(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* ------------------------------ proposals -------------------------- */

export const proposals = {
  list(tenantId: string, currentUserId?: string): Promise<ProposalView[]> {
    const list = allProposals()
      .filter((p) => p.tenantId === tenantId)
      .map((p) => enrich(p, currentUserId));
    return delay(list);
  },
  get(
    tenantId: string,
    id: string,
    currentUserId?: string,
  ): Promise<ProposalView | null> {
    const p = allProposals().find(
      (x) => x.tenantId === tenantId && x.id === id,
    );
    return delay(p ? enrich(p, currentUserId) : null);
  },
};

/* -------------------------------- votes ---------------------------- */

export class AlreadyVotedError extends Error {
  constructor() {
    super("You have already voted on this proposal.");
    this.name = "AlreadyVotedError";
  }
}

export const votes = {
  hasVoted(tenantId: string, proposalId: string, userId: string): boolean {
    return hasVoted(tenantId, proposalId, userId);
  },
  /** Mirrors the DB UNIQUE(proposal_id, user_id) — one vote per user. */
  cast(
    tenantId: string,
    proposalId: string,
    userId: string,
  ): Promise<ProposalView> {
    if (hasVoted(tenantId, proposalId, userId)) {
      return Promise.reject(new AlreadyVotedError());
    }
    recordVote(tenantId, proposalId, userId);
    const p = allProposals().find(
      (x) => x.tenantId === tenantId && x.id === proposalId,
    )!;
    return delay(enrich(p, userId), 300);
  },
};

/* -------------------------------- tally ---------------------------- */

export interface TallyGroup {
  constituency: string;
  votes: number;
}

export interface TallyData {
  constituencyLabel: string;
  totalVotes: number;
  totalProposals: number;
  groups: TallyGroup[];
  /** proposals sorted by vote count, enriched */
  ranked: ProposalView[];
}

export const tally = {
  get(tenant: Tenant, currentUserId?: string): Promise<TallyData> {
    const list = allProposals()
      .filter((p) => p.tenantId === tenant.id)
      .map((p) => enrich(p, currentUserId));
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
    return delay(
      {
        constituencyLabel: tenant.constituencyLabel,
        totalVotes: list.reduce((sum, p) => sum + p.votes, 0),
        totalProposals: list.length,
        groups,
        ranked,
      },
      120,
    );
  },
};

/* --------------------------- color helpers ------------------------- */
// tiny hex mixers so a provisioned tenant gets a full ramp from one color

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}
function parse(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ];
}
function toHex([r, g, b]: [number, number, number]) {
  return "#" + [r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("");
}
/** darken (amount < 0) toward black */
function shade(hex: string, amount: number): string {
  const [r, g, b] = parse(hex);
  const f = 1 + amount;
  return toHex([r * f, g * f, b * f]);
}
/** mix toward white by `amount` (0..1) for a soft tint */
function tint(hex: string, amount: number): string {
  const [r, g, b] = parse(hex);
  return toHex([
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount,
  ]);
}
