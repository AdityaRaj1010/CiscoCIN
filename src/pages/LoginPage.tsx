import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useSession } from "@/context/SessionContext";
import { auth } from "@/api";
import type { User } from "@/api/mock/users";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DuoModal } from "@/components/duo-modal";
import { cn } from "@/lib/utils";

export function LoginPage() {
  const { tenant } = useTenant();
  const { login, isAuthed } = useSession();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<User | null>(null);
  const [duoOpen, setDuoOpen] = useState(false);

  useEffect(() => {
    setSelected(null);
    auth.usersForTenant(tenant.id).then(setUsers);
  }, [tenant.id]);

  useEffect(() => {
    if (isAuthed) navigate("/feed", { replace: true });
  }, [isAuthed, navigate]);

  async function onVerified() {
    if (!selected) return;
    await login(selected.id);
    setDuoOpen(false);
    navigate("/feed", { replace: true });
  }

  return (
    <div className="relative min-h-[calc(100vh-3rem)] overflow-hidden">
      {/* tenant-colored ambient wash — subtle, re-themes with the tenant */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
        style={{
          background: `radial-gradient(120% 100% at 50% -20%, color-mix(in srgb, ${tenant.branding.primaryColor} 16%, transparent), transparent 70%)`,
        }}
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-md flex-col justify-center px-6 py-12">
        <div className="animate-rise">
          <div
            className="grid h-14 w-14 place-items-center rounded-2xl font-display text-xl font-semibold shadow-lg"
            style={{
              background: tenant.branding.primaryColor,
              color: tenant.branding.primaryForeground,
              boxShadow: `0 12px 30px -12px ${tenant.branding.primaryColor}`,
            }}
          >
            {tenant.branding.logoText}
          </div>
          <h1 className="mt-5 font-display text-[28px] font-semibold leading-tight tracking-tight text-ink">
            {tenant.name}
          </h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            Sign in to {tenant.kind} on CivicOS. Choose a demo account to
            continue.
          </p>
        </div>

        <div
          className="mt-8 animate-rise space-y-2"
          style={{ animationDelay: "60ms" }}
        >
          {users.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelected(u)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[calc(var(--radius-app)+2px)] border bg-surface p-3 text-left transition-all",
                selected?.id === u.id
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-line hover:border-line-strong",
              )}
            >
              <Avatar
                initials={u.avatarInitials}
                name={u.name}
                className="h-10 w-10 text-[13px]"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{u.name}</p>
                <p className="truncate text-[12px] text-ink-3">{u.role}</p>
              </div>
              <span
                className={cn(
                  "h-4 w-4 rounded-full border-2 transition-colors",
                  selected?.id === u.id
                    ? "border-primary bg-primary"
                    : "border-line-strong",
                )}
              />
            </button>
          ))}
        </div>

        <div
          className="mt-6 animate-rise"
          style={{ animationDelay: "120ms" }}
        >
          <Button
            size="lg"
            className="w-full"
            disabled={!selected}
            onClick={() => setDuoOpen(true)}
          >
            Continue with Duo
            <ArrowRight size={17} />
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 font-mono text-[11px] text-ink-3">
            <ShieldCheck size={13} className="text-ok" />
            Protected by two-factor authentication
          </p>
        </div>
      </div>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={onVerified}
        title="Confirm sign-in"
        context={selected ? `Signing in as ${selected.name}` : undefined}
      />
    </div>
  );
}
