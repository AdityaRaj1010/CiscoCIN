/**
 * CivicOS feature-module catalog.
 *
 * CivicOS is one codebase; each tenant enables a subset of these modules.
 * `built: true` modules are fully implemented in this demo. The rest render
 * as selectable-but-"coming soon" in the provisioner, so the OS looks like a
 * real product surface with a roadmap — not just the five screens we shipped.
 */
export type Sector = "education" | "government" | "ngo";

export interface FeatureModule {
  id: string;
  label: string;
  description: string;
  sectorTags: Sector[];
  built: boolean;
}

export const MODULES: FeatureModule[] = [
  {
    id: "proposals",
    label: "Proposals",
    description: "Citizens and members raise structured proposals.",
    sectorTags: ["education", "government", "ngo"],
    built: true,
  },
  {
    id: "voting",
    label: "Voting",
    description: "One-person-one-vote with MFA-gated ballots.",
    sectorTags: ["education", "government", "ngo"],
    built: true,
  },
  {
    id: "tally",
    label: "Live Tally",
    description: "Realtime results grouped by constituency.",
    sectorTags: ["education", "government", "ngo"],
    built: true,
  },
  {
    id: "participatory_budgeting",
    label: "Participatory Budgeting",
    description: "Allocate a shared budget across proposals.",
    sectorTags: ["education", "government"],
    built: true,
  },
  {
    id: "multilingual",
    label: "Multilingual (Bhashini)",
    description: "In-place translation for regional languages.",
    sectorTags: ["government", "ngo"],
    built: true,
  },
  {
    id: "grievances",
    label: "Grievance Redressal",
    description: "Track complaints from filing to resolution.",
    sectorTags: ["government", "ngo"],
    built: false,
  },
  {
    id: "town_halls",
    label: "Town Halls",
    description: "Scheduled deliberation sessions over Webex.",
    sectorTags: ["education", "government"],
    built: false,
  },
  {
    id: "petitions",
    label: "Petitions",
    description: "Threshold-based petitions that escalate automatically.",
    sectorTags: ["education", "government", "ngo"],
    built: false,
  },
  {
    id: "polls",
    label: "Quick Polls",
    description: "Lightweight sentiment checks.",
    sectorTags: ["education", "government", "ngo"],
    built: false,
  },
  {
    id: "elections",
    label: "Elections",
    description: "Slate-based representative elections.",
    sectorTags: ["education", "government"],
    built: false,
  },
  {
    id: "committees",
    label: "Committees",
    description: "Standing committees with delegated authority.",
    sectorTags: ["education", "government", "ngo"],
    built: false,
  },
  {
    id: "transparency",
    label: "Transparency Ledger",
    description: "Public audit log of every civic action.",
    sectorTags: ["government", "ngo"],
    built: false,
  },
  {
    id: "notices",
    label: "Notice Board",
    description: "Official announcements and gazettes.",
    sectorTags: ["education", "government"],
    built: false,
  },
  {
    id: "volunteering",
    label: "Volunteering",
    description: "Match members to on-ground tasks.",
    sectorTags: ["ngo"],
    built: false,
  },
  {
    id: "donations",
    label: "Donations",
    description: "Collect and account for contributions.",
    sectorTags: ["ngo"],
    built: false,
  },
  {
    id: "surveys",
    label: "Surveys",
    description: "Long-form structured feedback.",
    sectorTags: ["education", "government", "ngo"],
    built: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Participation and engagement dashboards.",
    sectorTags: ["education", "government", "ngo"],
    built: false,
  },
];

export const MODULE_BY_ID: Record<string, FeatureModule> = Object.fromEntries(
  MODULES.map((m) => [m.id, m]),
);

export const SECTORS: { id: Sector; label: string }[] = [
  { id: "education", label: "Education" },
  { id: "government", label: "Government" },
  { id: "ngo", label: "NGO" },
];
