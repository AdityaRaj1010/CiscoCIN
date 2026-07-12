"use client";

/**
 * CIN module views — component map.
 * Imported ONLY by app/t/[tenant]/[module]/page.tsx (the dispatcher).
 * Keeping this separate from registry.ts prevents the nav in layout.tsx
 * from pulling every module's client bundle.
 */
import type { Tenant } from "@/lib/tenant";
import { ProposalsView } from "./proposals/View";
import { TallyView } from "./tally/View";
import { BudgetingView } from "./budgeting/View";

export const VIEWS: Record<
  string,
  React.ComponentType<{ tenant: Tenant }>
> = {
  proposals: ProposalsView,
  tally: TallyView,
  budgeting: BudgetingView,
};
