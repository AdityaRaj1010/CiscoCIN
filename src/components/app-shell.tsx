import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Settings2, Wallet } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useSession } from "@/context/SessionContext";
import { useLang } from "@/context/LanguageContext";
import { LanguageToggle } from "@/components/language-toggle";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function TenantBadge() {
  const { tenant } = useTenant();
  return (
    <Link to="/feed" className="flex items-center gap-2.5">
      <span
        className="grid h-9 w-9 place-items-center rounded-lg font-display text-sm font-semibold"
        style={{
          background: tenant.branding.primaryColor,
          color: tenant.branding.primaryForeground,
        }}
      >
        {tenant.branding.logoText}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold text-ink">
          {tenant.name}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wide text-ink-3">
          {tenant.kind}
        </span>
      </span>
    </Link>
  );
}

function NavTab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex h-full items-center px-1 text-sm font-medium transition-colors",
          isActive ? "text-ink" : "text-ink-3 hover:text-ink-2",
        )
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  );
}

function UserMenu() {
  const { user, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-line-strong bg-surface py-1 pl-1 pr-3 transition-colors hover:bg-surface-2"
      >
        <Avatar initials={user.avatarInitials} name={user.name} className="h-7 w-7" />
        <span className="hidden text-[13px] font-medium text-ink sm:block">
          {user.name.split(" ")[0]}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-60 overflow-hidden rounded-xl border border-line bg-surface shadow-xl shadow-system/10">
          <div className="flex items-center gap-2.5 border-b border-line p-3">
            <Avatar initials={user.avatarInitials} name={user.name} className="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-[12px] text-ink-3">{user.role}</p>
            </div>
          </div>
          <div className="p-1.5">
            <p className="px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-ink-3">
              {user.constituency}
            </p>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-[13px] text-danger transition-colors hover:bg-danger/8"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const { hasFeature } = useTenant();
  const { t } = useLang();
  const location = useLocation();

  // scroll to top on route change for a real-app feel
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      <header className="sticky top-12 z-40 border-b border-line bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
          <TenantBadge />
          <nav className="ml-4 hidden h-full items-center gap-6 md:flex">
            {hasFeature("proposals") && (
              <NavTab to="/feed">{t("nav.feed")}</NavTab>
            )}
            {hasFeature("tally") && (
              <NavTab to="/tally">{t("nav.tally")}</NavTab>
            )}
            {hasFeature("participatory_budgeting") && (
              <NavTab to="/budgeting">
                <Wallet size={14} className="mr-1.5" />
                {t("nav.budget")}
              </NavTab>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            {hasFeature("multilingual") && <LanguageToggle />}
            <Link
              to="/provision"
              title="Provision a new tenant"
              className="hidden h-9 items-center gap-1.5 rounded-[var(--radius-app)] border border-line-strong bg-surface px-2.5 text-[13px] text-ink-2 transition-colors hover:bg-surface-2 sm:flex"
            >
              <Settings2 size={15} />
              Admin
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
