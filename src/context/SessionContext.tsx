import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTenant } from "@/context/TenantContext";
import { auth } from "@/api";
import { SEED_USERS, type User } from "@/api/mock/users";
import { getProvisionedUsers, getSession, setSession } from "@/lib/store";

interface SessionContextValue {
  user: User | null;
  /** logged in AND the session belongs to the active tenant */
  isAuthed: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Resolve the session's user synchronously from the store. Doing this at render
 * time (not in an async effect) means a hard refresh on a protected route keeps
 * you signed in instead of flashing to /login before auth resolves.
 */
function resolveUser(tenantId: string): User | null {
  const s = getSession();
  if (!s || s.tenantId !== tenantId) return null;
  const all = [...SEED_USERS, ...getProvisionedUsers()];
  const u = all.find((x) => x.id === s.userId);
  return u && u.tenantId === tenantId ? u : null;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [user, setUser] = useState<User | null>(() => resolveUser(tenant.id));

  // A session is only valid for the tenant it was created under. Switching
  // tenants drops you to that tenant's branded login — realistic, and it shows
  // the per-tenant login in the demo.
  useEffect(() => {
    setUser(resolveUser(tenant.id));
  }, [tenant.id]);

  const login = useCallback(
    async (userId: string) => {
      await auth.login(tenant.id, userId);
      setUser(resolveUser(tenant.id));
    },
    [tenant.id],
  );

  const logout = useCallback(() => {
    setSession(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthed: !!user, login, logout }),
    [user, login, logout],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
