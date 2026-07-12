import type { ModuleManifest } from "../types";

export const manifest: ModuleManifest = {
  id: "tally",
  label: "Live Tally",
  blurb: "Realtime results grouped by constituency.",
  kind: "page",
  status: "live",
  core: true,
  nav: { order: 2, icon: "Activity" },
};
