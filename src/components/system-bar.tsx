import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Command, Plus, RotateCcw } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { resetDemo } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/config/tenants";

function TenantMark({ tenant, className }: { tenant: Tenant; className?: string }) {
  return (
    <span
      className={cn(
        "grid place-items-center rounded-md font-display text-[13px] font-semibold leading-none",
        className,
      )}
      style={{
        background: tenant.branding.primaryColor,
        color: tenant.branding.primaryForeground,
      }}
    >
      {tenant.branding.logoText}
    </span>
  );
}

/**
 * The persistent OS chrome. Dark, quiet, always present — the tenant switcher
 * lives here so flipping tenants reads as "booting the OS into another client",
 * re-theming everything below it.
 */
export function SystemBar() {
  const { tenant, tenants, switchTenant, hasFeature } = useTenant();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="sticky top-0 z-50 flex h-12 items-center gap-3 border-b border-system-line bg-system px-3 text-system-ink">
      {/* wordmark */}
      <div className="flex items-center gap-2 pr-1">
        <span className="grid h-6 w-6 place-items-center rounded bg-primary text-primary-foreground">
          <Command size={14} strokeWidth={2.5} />
        </span>
        <span className="font-display text-[15px] font-semibold tracking-tight">
          Civic<span className="text-system-ink-2">OS</span>
        </span>
      </div>

      <span className="hidden text-system-line sm:block">/</span>

      {/* tenant switcher */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 items-center gap-2.5 rounded-md border border-system-line bg-system-2 pl-1.5 pr-2 text-left transition-colors hover:border-[color-mix(in_srgb,var(--primary)_55%,var(--system-line))]"
        >
          <TenantMark tenant={tenant} className="h-6 w-6" />
          <span className="flex flex-col leading-none">
            <span className="text-[13px] font-medium">{tenant.name}</span>
            <span className="font-mono text-[10px] text-system-ink-2">
              {tenant.kind}
            </span>
          </span>
          <ChevronsUpDown size={14} className="text-system-ink-2" />
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+6px)] w-80 overflow-hidden rounded-lg border border-system-line bg-system-2 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-system-ink-2">
                Switch tenant
              </span>
              <span className="font-mono text-[10px] text-system-ink-2">
                {tenants.length} live
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto px-1.5 pb-1.5">
              {tenants.map((t) => {
                const active = t.id === tenant.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      switchTenant(t.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                      active ? "bg-white/5" : "hover:bg-white/5",
                    )}
                  >
                    <TenantMark tenant={t} className="h-7 w-7" />
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-[13px] font-medium text-system-ink">
                        {t.name}
                      </span>
                      <span className="font-mono text-[10px] text-system-ink-2">
                        {t.sector} · {t.features.length} modules
                      </span>
                    </span>
                    {active && <Check size={15} className="text-primary" />}
                  </button>
                );
              })}
            </div>
            <div className="border-t border-system-line p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  navigate("/provision");
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-[13px] text-system-ink-2 transition-colors hover:bg-white/5 hover:text-system-ink"
              >
                <Plus size={15} />
                Provision new tenant
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* live feature-flag readout — the "config-driven" proof, in system mono */}
        <div className="hidden items-center gap-1.5 font-mono text-[11px] text-system-ink-2 md:flex">
          <span className="text-system-ink-2">flags:</span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              hasFeature("participatory_budgeting")
                ? "bg-white/5 text-system-ink"
                : "opacity-40",
            )}
          >
            budgeting
          </span>
          <span
            className={cn(
              "rounded px-1.5 py-0.5",
              hasFeature("multilingual")
                ? "bg-white/5 text-system-ink"
                : "opacity-40",
            )}
          >
            multilingual
          </span>
        </div>
        <button
          onClick={() => {
            resetDemo();
            window.location.href = "/";
          }}
          title="Reset demo data"
          className="grid h-7 w-7 place-items-center rounded-md text-system-ink-2 transition-colors hover:bg-white/5 hover:text-system-ink"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  );
}
