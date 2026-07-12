/**
 * CIN module registry — pure data, no components.
 * Imported by server code (layout, middleware, admin). Safe to use in RSC.
 */
import type { ModuleManifest } from "./types";

import { manifest as proposals } from "./proposals/manifest";
import { manifest as voting } from "./voting/manifest";
import { manifest as tally } from "./tally/manifest";
import { manifest as budgeting } from "./budgeting/manifest";
import { manifest as townhalls } from "./townhalls/manifest";
import { manifest as petitions } from "./petitions/manifest";
import { manifest as polls } from "./polls/manifest";
import { manifest as elections } from "./elections/manifest";
import { manifest as committees } from "./committees/manifest";
import { manifest as noticeboard } from "./noticeboard/manifest";
import { manifest as surveys } from "./surveys/manifest";
import { manifest as analytics } from "./analytics/manifest";

export const MANIFESTS: Record<string, ModuleManifest> = {
  proposals,
  voting,
  tally,
  budgeting,
  townhalls,
  petitions,
  polls,
  elections,
  committees,
  noticeboard,
  surveys,
  analytics,
};

/** Page modules only — these get routes and nav items. */
export const PAGE_MODULES = Object.values(MANIFESTS)
  .filter((m) => m.kind === "page")
  .sort((a, b) => (a.nav?.order ?? 99) - (b.nav?.order ?? 99));
