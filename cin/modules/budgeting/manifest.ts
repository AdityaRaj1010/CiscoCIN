import type { ModuleManifest } from "../types";

export const manifest: ModuleManifest = {
  id: "budgeting",
  label: "Participatory Budgeting",
  blurb: "Allocate a shared budget across proposals.",
  kind: "page",
  status: "live",
  nav: { order: 3, icon: "Wallet" },
};
