import type { ModuleManifest } from "../types";

export const manifest: ModuleManifest = {
  id: "townhalls",
  label: "Town Halls",
  blurb: "Scheduled deliberation sessions over Webex.",
  kind: "page",
  status: "preview",
  requires: ["webex"],
  nav: { order: 4, icon: "Video" },
};
