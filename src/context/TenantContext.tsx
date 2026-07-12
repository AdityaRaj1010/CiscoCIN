import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { Tenant } from "@/config/tenants";
import {
  getTenants,
  getCurrentTenantId,
  setCurrentTenantId,
} from "@/lib/store";

interface TenantContextValue {
  tenant: Tenant;
  tenants: Tenant[];
  /** switch the active tenant — re-themes the whole app */
  switchTenant: (id: string) => void;
  /** re-read tenants from the store (after provisioning a new one) */
  refreshTenants: () => void;
  /** feature resolver — gates nav items, routes, and modules */
  hasFeature: (id: string) => boolean;
}

const TenantContext = createContext<TenantContextValue | null>(null);

/** Push a tenant's branding into the CSS custom properties on :root. */
function applyTheme(tenant: Tenant) {
  const b = tenant.branding;
  const root = document.documentElement;
  const map: Record<string, string> = {
    "--primary": b.primaryColor,
    "--primary-strong": b.primaryStrong,
    "--primary-soft": b.primarySoft,
    "--primary-foreground": b.primaryForeground,
    "--accent": b.accentColor,
    "--accent-soft": b.accentSoft,
    "--accent-foreground": b.accentForeground,
  };
  for (const [k, v] of Object.entries(map)) root.style.setProperty(k, v);
  root.dataset.tenant = tenant.id;
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>(() => getTenants());
  const [tenantId, setTenantId] = useState<string>(() => {
    const saved = getCurrentTenantId();
    const list = getTenants();
    return list.some((t) => t.id === saved) ? saved : list[0].id;
  });

  const tenant = useMemo(
    () => tenants.find((t) => t.id === tenantId) ?? tenants[0],
    [tenants, tenantId],
  );

  // apply theme on mount and whenever the active tenant changes
  useEffect(() => {
    applyTheme(tenant);
  }, [tenant]);

  const switchTenant = useCallback((id: string) => {
    // brief transition class so the re-theme animates like a "boot"
    const root = document.documentElement;
    root.classList.add("theme-transition");
    setTenantId(id);
    setCurrentTenantId(id);
    window.setTimeout(() => root.classList.remove("theme-transition"), 360);
  }, []);

  const refreshTenants = useCallback(() => {
    setTenants(getTenants());
  }, []);

  const hasFeature = useCallback(
    (id: string) => tenant.features.includes(id),
    [tenant],
  );

  const value = useMemo(
    () => ({ tenant, tenants, switchTenant, refreshTenants, hasFeature }),
    [tenant, tenants, switchTenant, refreshTenants, hasFeature],
  );

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within a TenantProvider");
  return ctx;
}
