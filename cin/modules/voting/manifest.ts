import type { ModuleManifest } from "../types";

export const manifest: ModuleManifest = {
  id: "voting",
  label: "Voting",
  blurb: "One-person-one-vote with MFA-gated ballots.",
  kind: "capability",
  status: "live",
  core: true,
  requires: ["duo"],
};
