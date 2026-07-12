"use client";

import { VIEWS } from "@/modules/views";
import type { Tenant } from "@/lib/tenant";

/**
 * Client wrapper that resolves and renders the correct View component.
 * Separated from the server page so that component imports stay client-only.
 */
export function ModuleDispatcher({
  module,
  tenant,
}: {
  module: string;
  tenant: Tenant;
}) {
  const View = VIEWS[module];
  if (!View) return null;
  return <View tenant={tenant} />;
}
