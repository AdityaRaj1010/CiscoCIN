import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Sparkles, Wallet } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { tenants } from "@/api";
import { MODULES, SECTORS, type Sector } from "@/config/modules";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn, initials } from "@/lib/utils";

const CORE = ["proposals", "voting", "tally"];

const PRIMARY_SWATCHES = [
  "#2f4bd8",
  "#177a4a",
  "#7c3aed",
  "#0e7490",
  "#b8420f",
  "#be123c",
];
const ACCENT_SWATCHES = [
  "#d99b1c",
  "#c85a2b",
  "#0ea5e9",
  "#16a34a",
  "#db2777",
  "#4f46e5",
];

const SECTOR_DEFAULTS: Record<Sector, { kind: string; constituency: string }> = {
  education: { kind: "Students' Union", constituency: "Department" },
  government: { kind: "Local Council", constituency: "Ward" },
  ngo: { kind: "Members' Assembly", constituency: "Chapter" },
};

export function ProvisionPage() {
  const { switchTenant, refreshTenants } = useTenant();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [sector, setSector] = useState<Sector>("education");
  const [kind, setKind] = useState(SECTOR_DEFAULTS.education.kind);
  const [constituency, setConstituency] = useState(
    SECTOR_DEFAULTS.education.constituency,
  );
  const [primary, setPrimary] = useState(PRIMARY_SWATCHES[0]);
  const [accent, setAccent] = useState(ACCENT_SWATCHES[0]);
  const [features, setFeatures] = useState<string[]>([...CORE]);
  const [creating, setCreating] = useState(false);

  const mark = useMemo(() => (name ? initials(name) || name.slice(0, 2) : "•"), [name]);

  function pickSector(s: Sector) {
    setSector(s);
    setKind(SECTOR_DEFAULTS[s].kind);
    setConstituency(SECTOR_DEFAULTS[s].constituency);
  }

  function toggleFeature(id: string) {
    if (CORE.includes(id)) return; // core modules are always on
    setFeatures((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  }

  async function create() {
    if (!name.trim()) return;
    setCreating(true);
    const tenant = await tenants.create({
      name: name.trim(),
      kind,
      sector,
      constituencyLabel: constituency,
      primaryColor: primary,
      accentColor: accent,
      features,
    });
    refreshTenants();
    switchTenant(tenant.id);
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
          CivicOS · provisioner
        </span>
      </div>
      <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink">
        Provision a new civic app
      </h1>
      <p className="mt-1 max-w-xl text-[14px] text-ink-2">
        One config row spins up a fully themed, feature-scoped tenant. It goes
        live in the switcher the moment you create it.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* form */}
        <div className="space-y-7">
          <section>
            <Label>Client name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Greenfield University"
              autoFocus
            />
          </section>

          <section>
            <Label>Sector</Label>
            <div className="grid grid-cols-3 gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => pickSector(s.id)}
                  className={cn(
                    "rounded-[var(--radius-app)] border px-3 py-2.5 text-[13px] font-medium transition-all",
                    sector === s.id
                      ? "border-primary bg-primary-soft text-primary-strong"
                      : "border-line bg-surface text-ink-2 hover:border-line-strong",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-4">
            <section>
              <Label hint="shown in the bar">Body type</Label>
              <Input value={kind} onChange={(e) => setKind(e.target.value)} />
            </section>
            <section>
              <Label hint="how groups map">Constituency</Label>
              <Input
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
              />
            </section>
          </div>

          <section>
            <Label>Brand color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRIMARY_SWATCHES.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={primary === c}
                  onClick={() => setPrimary(c)}
                />
              ))}
              <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-2 text-[12px] text-ink-2">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => setPrimary(e.target.value)}
                  className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                />
                custom
              </label>
            </div>
          </section>

          <section>
            <Label>Accent color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_SWATCHES.map((c) => (
                <Swatch
                  key={c}
                  color={c}
                  active={accent === c}
                  onClick={() => setAccent(c)}
                />
              ))}
              <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-2 text-[12px] text-ink-2">
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0"
                />
                custom
              </label>
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <Label>Feature modules</Label>
              <span className="font-mono text-[11px] text-ink-3">
                {features.length} enabled
              </span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {MODULES.filter((m) => m.sectorTags.includes(sector)).map((m) => {
                const on = features.includes(m.id);
                const core = CORE.includes(m.id);
                return (
                  <button
                    key={m.id}
                    onClick={() => toggleFeature(m.id)}
                    disabled={core}
                    className={cn(
                      "flex items-start gap-2.5 rounded-[var(--radius-app)] border p-3 text-left transition-all",
                      on
                        ? "border-primary/40 bg-primary-soft/50"
                        : "border-line bg-surface hover:border-line-strong",
                      core && "cursor-default",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border transition-colors",
                        on
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-line-strong",
                      )}
                    >
                      {on && <Check size={11} strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
                        {m.label}
                        {core && (
                          <span className="font-mono text-[9px] uppercase text-primary">
                            core
                          </span>
                        )}
                        {!m.built && (
                          <span className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[9px] uppercase text-ink-3">
                            soon
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-[11.5px] text-ink-3">
                        {m.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* live preview */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-3">
            live preview
          </p>
          <div className="overflow-hidden rounded-[calc(var(--radius-app)+4px)] border border-line bg-surface shadow-lg shadow-system/10">
            {/* mini app header in the chosen theme */}
            <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
              <span
                className="grid h-8 w-8 place-items-center rounded-lg font-display text-[13px] font-semibold"
                style={{ background: primary, color: "#fff" }}
              >
                {mark}
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[13px] font-semibold text-ink">
                  {name || "Your civic app"}
                </span>
                <span className="font-mono text-[9px] uppercase text-ink-3">
                  {kind}
                </span>
              </span>
            </div>
            {/* mini proposal card */}
            <div className="space-y-3 p-3">
              <div className="rounded-[var(--radius-app)] border border-line p-3">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    background: `color-mix(in srgb, ${primary} 12%, white)`,
                    color: primary,
                  }}
                >
                  Notice & Input
                </span>
                <p className="mt-2 text-[13px] font-semibold text-ink">
                  Publish a monthly open agenda
                </p>
                <div className="mt-3 flex items-center justify-between">
                  {features.includes("participatory_budgeting") ? (
                    <span
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: accent }}
                    >
                      <Wallet size={11} /> ₹40K
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-3">
                      {constituency} 1
                    </span>
                  )}
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                    style={{ background: primary, color: "#fff" }}
                  >
                    28 votes
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {features.slice(0, 5).map((f) => (
                  <span
                    key={f}
                    className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-3"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            size="lg"
            disabled={!name.trim() || creating}
            onClick={create}
          >
            {creating ? (
              <>
                <Loader2 size={17} className="animate-[spin_800ms_linear_infinite]" />
                Provisioning…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Create tenant
              </>
            )}
          </Button>
          <p className="mt-2 text-center font-mono text-[11px] text-ink-3">
            goes live in the switcher instantly
          </p>
        </aside>
      </div>
    </div>
  );
}

function Swatch({
  color,
  active,
  onClick,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110",
        active && "ring-2 ring-offset-2 ring-offset-paper",
      )}
      style={{ background: color, boxShadow: active ? `0 0 0 2px ${color}` : undefined }}
      aria-label={color}
    >
      {active && <Check size={14} className="text-white" strokeWidth={3} />}
    </button>
  );
}
