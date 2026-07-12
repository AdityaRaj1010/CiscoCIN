import type { Sector } from "./modules";

/**
 * A tenant is a config row. Everything about how CivicOS looks and which
 * modules exist for a client is derived from this object at runtime.
 * The provisioner writes new tenants of exactly this shape into the store.
 */
export interface TenantBranding {
  logoText: string;
  /** owned tenant color; drives --primary at runtime */
  primaryColor: string;
  primaryStrong: string;
  primarySoft: string;
  primaryForeground: string;
  /** owned tenant accent; drives --accent at runtime */
  accentColor: string;
  accentSoft: string;
  accentForeground: string;
}

export interface Tenant {
  id: string;
  name: string;
  /** short kicker shown in the login + system bar, e.g. "College Union" */
  kind: string;
  sector: Sector;
  /** constituency label — what a "group" means for this tenant */
  constituencyLabel: string;
  branding: TenantBranding;
  /** enabled module ids — the feature resolver gates on this */
  features: string[];
  /** whether a Bhashini-style language toggle is offered */
  seed: boolean;
}

export const SEED_TENANTS: Tenant[] = [
  {
    id: "xaviers",
    name: "St. Xavier's College",
    kind: "Students' Union",
    sector: "education",
    constituencyLabel: "Department",
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
    features: ["proposals", "voting", "tally", "participatory_budgeting"],
    seed: true,
  },
  {
    id: "devgaon",
    name: "Devgaon Panchayat",
    kind: "Gram Sabha",
    sector: "government",
    constituencyLabel: "Ward",
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
    features: ["proposals", "voting", "tally", "multilingual"],
    seed: true,
  },
];
