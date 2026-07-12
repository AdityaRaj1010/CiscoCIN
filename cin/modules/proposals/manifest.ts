import type { ModuleManifest } from "@/modules/types";

export const manifest: ModuleManifest = {
  id: "proposals",
  label: "Proposals",
  blurb: "Citizens and members raise structured proposals.",
  kind: "page",
  status: "live",
  core: true,
  nav: { order: 1, icon: "FileText" },
};
