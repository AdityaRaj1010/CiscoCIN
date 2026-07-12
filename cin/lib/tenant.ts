import { getDb } from "@/lib/db";

/**
 * Tenant resolution — queries Postgres directly, falling back to seed data.
 */

export interface TenantBranding {
  logoText: string;
  primaryColor: string;
  primaryStrong: string;
  primarySoft: string;
  primaryForeground: string;
  accentColor: string;
  accentSoft: string;
  accentForeground: string;
}

export interface Tenant {
  slug: string;
  name: string;
  sector: string;
  bodyType: string;
  constituencyLabel: string;
  features: string[];
  branding: TenantBranding;
  /** Per-tenant override of WEBEX_VOTE_THRESHOLD. Null/undefined = use the env default. */
  voteThreshold?: number | null;
}

const SEED_TENANTS: Tenant[] = [
  {
    slug: "xaviers",
    name: "St. Xavier's College",
    sector: "education",
    bodyType: "Students' Union",
    constituencyLabel: "Department",
    features: ["proposals", "voting", "tally", "budgeting"],
    branding: {
      logoText: "SX",
      primaryColor: "#2f4bd8",
      primaryStrong: "#2338b0",
      primarySoft: "#eaeeff",
      primaryForeground: "#ffffff",
      accentColor: "#d99b1c",
      accentSoft: "#fdf3dc",
      accentForeground: "#2a2109",
    },
  },
  {
    slug: "devgaon",
    name: "Devgaon Panchayat",
    sector: "government",
    bodyType: "Gram Sabha",
    constituencyLabel: "Ward",
    features: ["proposals", "voting", "tally"],
    branding: {
      logoText: "दे",
      primaryColor: "#177a4a",
      primaryStrong: "#0f5e39",
      primarySoft: "#e3f5ea",
      primaryForeground: "#ffffff",
      accentColor: "#c85a2b",
      accentSoft: "#fbe9df",
      accentForeground: "#2c130a",
    },
  },
];

export async function getTenant(slug: string): Promise<Tenant | null> {
  const sql = getDb();
  if (sql) {
    try {
      const [row] = await sql`SELECT * FROM tenants WHERE slug = ${slug}`;
      if (row) {
        return {
          slug: row.slug,
          name: row.name,
          sector: row.sector,
          bodyType: row.body_type,
          constituencyLabel: row.constituency_label,
          features: row.features || [],
          branding: row.branding || {},
          voteThreshold: row.vote_threshold ?? null,
        };
      }
    } catch (err) {
      console.error("getTenant DB query error:", err);
    }
  }
  return SEED_TENANTS.find((t) => t.slug === slug) ?? null;
}

export async function listTenants(): Promise<Tenant[]> {
  const sql = getDb();
  if (sql) {
    try {
      const rows = await sql`SELECT * FROM tenants ORDER BY created_at DESC`;
      if (rows && rows.length > 0) {
        return rows.map((row) => ({
          slug: row.slug,
          name: row.name,
          sector: row.sector,
          bodyType: row.body_type,
          constituencyLabel: row.constituency_label,
          features: row.features || [],
          branding: row.branding || {},
          voteThreshold: row.vote_threshold ?? null,
        }));
      }
    } catch (err) {
      console.error("listTenants DB query error:", err);
    }
  }
  return SEED_TENANTS;
}

/**
 * Resolve which tenant an inbound Webex event belongs to. This is the
 * multi-tenancy proof point at the integration layer: one bot, every
 * tenant, and `roomId` is the only thing that tells them apart.
 */
export async function getTenantByWebexRoom(roomId: string): Promise<Tenant | null> {
  const sql = getDb();
  if (!sql) return null;
  try {
    const [row] = await sql`SELECT * FROM tenants WHERE webex_room_id = ${roomId}`;
    if (!row) return null;
    return {
      slug: row.slug,
      name: row.name,
      sector: row.sector,
      bodyType: row.body_type,
      constituencyLabel: row.constituency_label,
      features: row.features || [],
      branding: row.branding || {},
    };
  } catch (err) {
    console.error("getTenantByWebexRoom DB query error:", err);
    return null;
  }
}
