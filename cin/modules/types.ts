/**
 * CIN module system types.
 *
 * Two kinds of module:
 *   'page'       → gets a route + nav item
 *   'capability' → gates behaviour inside other modules (e.g., voting)
 */
export type ModuleKind = "page" | "capability";
export type ModuleStatus = "live" | "preview";

export type ModuleManifest = {
  id: string;
  label: string;
  blurb: string;
  kind: ModuleKind;
  status: ModuleStatus;
  core?: boolean;
  requires?: ("duo" | "webex" | "meraki" | "bhashini")[];
  nav?: { order: number; icon: string };
};
