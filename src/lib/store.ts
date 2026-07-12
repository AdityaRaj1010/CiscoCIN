import { SEED_TENANTS, type Tenant } from "@/config/tenants";
import type { User } from "@/api/mock/users";
import type { Proposal } from "@/api/mock/proposals";

/**
 * The single source of truth for mutable demo state, backed by localStorage
 * so provisioned tenants and cast votes survive a refresh. Everything the
 * mock api layer persists flows through here; when a real backend lands, this
 * file is the only thing that gets swapped for network calls.
 */

const KEYS = {
  tenants: "civicos.tenants.v1", // provisioned tenants (seed tenants are code)
  users: "civicos.users.v1", // demo users seeded for provisioned tenants
  proposals: "civicos.proposals.v1", // starter proposals for provisioned tenants
  votes: "civicos.votes.v1", // { [tenantId]: { [proposalId]: userId[] } }
  session: "civicos.session.v1", // { tenantId, userId } | null
  currentTenant: "civicos.currentTenant.v1",
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* demo: ignore quota / private-mode errors */
  }
}

/* ----------------------------- tenants ----------------------------- */

export function getTenants(): Tenant[] {
  const provisioned = read<Tenant[]>(KEYS.tenants, []);
  // provisioned tenants can override seeds by id (rare), but keep order stable
  const seedIds = new Set(SEED_TENANTS.map((t) => t.id));
  const extras = provisioned.filter((t) => !seedIds.has(t.id));
  return [...SEED_TENANTS, ...extras];
}

export function addTenant(tenant: Tenant): Tenant {
  const provisioned = read<Tenant[]>(KEYS.tenants, []);
  provisioned.push(tenant);
  write(KEYS.tenants, provisioned);
  return tenant;
}

/* ----------------- provisioned users & proposals ------------------- */
// New tenants ship with a little seed content so they're walkable the moment
// they're created — the api merges these with the code-defined seed data.

export function getProvisionedUsers(): User[] {
  return read<User[]>(KEYS.users, []);
}

export function addProvisionedUsers(users: User[]) {
  write(KEYS.users, [...getProvisionedUsers(), ...users]);
}

export function getProvisionedProposals(): Proposal[] {
  return read<Proposal[]>(KEYS.proposals, []);
}

export function addProvisionedProposals(items: Proposal[]) {
  write(KEYS.proposals, [...getProvisionedProposals(), ...items]);
}

/* --------------------------- current tenant ------------------------ */

export function getCurrentTenantId(): string {
  return read<string>(KEYS.currentTenant, SEED_TENANTS[0].id);
}

export function setCurrentTenantId(id: string) {
  write(KEYS.currentTenant, id);
}

/* ------------------------------ votes ------------------------------ */

type VoteMap = Record<string, Record<string, string[]>>;

export function getVotes(): VoteMap {
  return read<VoteMap>(KEYS.votes, {});
}

export function recordVote(tenantId: string, proposalId: string, userId: string) {
  const votes = getVotes();
  votes[tenantId] ??= {};
  votes[tenantId][proposalId] ??= [];
  if (!votes[tenantId][proposalId].includes(userId)) {
    votes[tenantId][proposalId].push(userId);
  }
  write(KEYS.votes, votes);
}

export function hasVoted(tenantId: string, proposalId: string, userId: string) {
  return getVotes()[tenantId]?.[proposalId]?.includes(userId) ?? false;
}

/* ----------------------------- session ----------------------------- */

export interface Session {
  tenantId: string;
  userId: string;
}

export function getSession(): Session | null {
  return read<Session | null>(KEYS.session, null);
}

export function setSession(session: Session | null) {
  write(KEYS.session, session);
}

export function resetDemo() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}
