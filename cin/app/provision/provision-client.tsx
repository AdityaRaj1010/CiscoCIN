"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";

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

const SECTORS = [
  { id: "education", label: "Education / Campus" },
  { id: "government", label: "Local Panchayat / Council" },
  { id: "ngo", label: "NGO / Co-op / Assembly" },
] as const;

type Sector = (typeof SECTORS)[number]["id"];

const SECTOR_DEFAULTS: Record<Sector, { kind: string; constituency: string }> = {
  education: { kind: "Students' Union", constituency: "Department" },
  government: { kind: "Local Council", constituency: "Ward" },
  ngo: { kind: "Members' Assembly", constituency: "Chapter" },
};

const AVAILABLE_MODULES = [
  { id: "proposals", label: "Proposals Feed", description: "4-stage trust filter & noticeboard", sectorTags: ["education", "government", "ngo"], built: true },
  { id: "voting", label: "MFA Verification", description: "One-person-one-vote Duo verification", sectorTags: ["education", "government", "ngo"], built: true },
  { id: "tally", label: "Live Tally", description: "Realtime constituency support breakdown", sectorTags: ["education", "government", "ngo"], built: true },
  { id: "budgeting", label: "Participatory Budgeting", description: "Shared pool allocation & live percentages", sectorTags: ["education", "government", "ngo"], built: true },
  { id: "townhalls", label: "Live Townhalls", description: "Streamed civic Q&A sessions", sectorTags: ["education", "government", "ngo"], built: false },
  { id: "petitions", label: "Signature Drives", description: "Threshold-triggered formal petitions", sectorTags: ["education", "government", "ngo"], built: false },
  { id: "polls", label: "Pulse Surveys", description: "Fast feedback on immediate community issues", sectorTags: ["education", "government", "ngo"], built: false },
];

function getInitials(name: string) {
  if (!name.trim()) return "•";
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function ProvisionClient() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [sector, setSector] = useState<Sector>("education");
  const [kind, setKind] = useState(SECTOR_DEFAULTS.education.kind);
  const [constituency, setConstituency] = useState(SECTOR_DEFAULTS.education.constituency);
  const [primary, setPrimary] = useState(PRIMARY_SWATCHES[0]);
  const [accent, setAccent] = useState(ACCENT_SWATCHES[0]);
  const [features, setFeatures] = useState<string[]>([...CORE, "budgeting"]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mark = useMemo(() => getInitials(name), [name]);

  function handleNameChange(val: string) {
    setName(val);
    if (!slugEdited) {
      const autoSlug = val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(autoSlug);
    }
  }

  function pickSector(s: Sector) {
    setSector(s);
    setKind(SECTOR_DEFAULTS[s].kind);
    setConstituency(SECTOR_DEFAULTS[s].constituency);
  }

  function toggleFeature(id: string) {
    if (CORE.includes(id)) return;
    setFeatures((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  }

  async function create() {
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    setError(null);

    const branding = {
      logoText: mark,
      primaryColor: primary,
      primaryStrong: primary,
      primarySoft: "color-mix(in srgb, " + primary + " 15%, white)",
      primaryForeground: "#ffffff",
      accentColor: accent,
      accentSoft: "color-mix(in srgb, " + accent + " 18%, white)",
      accentForeground: "#2a2109",
    };

    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          sector,
          bodyType: kind,
          constituencyLabel: constituency,
          features,
          branding,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to provision tenant");
      }

      const createdSlug = data.tenant.slug;
      const firstPage = features.find((f) => ["proposals", "tally", "budgeting"].includes(f)) || "proposals";
      router.push(`/t/${createdSlug}/${firstPage}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper py-10 px-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to Directory
        </Link>

        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-accent" />
          <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
            CIN · provisioner
          </span>
        </div>
        <h1 className="mt-2 font-display text-[28px] font-semibold tracking-tight text-ink">
          Provision a new civic tenant
        </h1>
        <p className="mt-1 max-w-xl text-[14px] text-ink-2">
          One config row spins up a fully isolated, themed, and feature-scoped URL portal on the Civic Intelligence Network.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* form */}
          <div className="space-y-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <section>
                <Label>Client name</Label>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Greenfield University"
                  autoFocus
                />
              </section>
              <section>
                <Label hint="URL slug (/t/[slug]/*)">Tenant Slug</Label>
                <Input
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-"));
                  }}
                  placeholder="greenfield"
                />
              </section>
            </div>

            <section>
              <Label>Sector</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickSector(s.id)}
                    className={cn(
                      "rounded-[var(--radius-app)] border px-3 py-2.5 text-[13px] font-medium transition-all text-left",
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
                <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-2.5 text-[12px] text-ink-2">
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
                <label className="ml-1 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-line-strong px-2.5 text-[12px] text-ink-2">
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
                {AVAILABLE_MODULES.filter((m) => m.sectorTags.includes(sector)).map((m) => {
                  const on = features.includes(m.id);
                  const core = CORE.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleFeature(m.id)}
                      disabled={core}
                      className={cn(
                        "flex items-start gap-2.5 rounded-[var(--radius-app)] border p-3 text-left transition-all",
                        on
                          ? "border-primary/40 bg-primary-soft/50"
                          : "border-line bg-surface hover:border-line-strong",
                        core && "cursor-default opacity-80",
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
          <aside className="lg:sticky lg:top-12 lg:self-start">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-3">
              live preview
            </p>
            <div className="overflow-hidden rounded-[calc(var(--radius-app)+4px)] border border-line bg-surface shadow-lg">
              {/* mini app header in the chosen theme */}
              <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
                <span
                  className="grid h-9 w-9 place-items-center rounded-lg font-display text-sm font-semibold shadow-sm"
                  style={{ background: primary, color: "#fff" }}
                >
                  {mark}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-[14px] font-semibold text-ink">
                    {name || "Your civic tenant"}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-ink-3">
                    {kind}
                  </span>
                </span>
              </div>
              {/* mini proposal card */}
              <div className="space-y-3.5 p-4">
                <div className="rounded-[var(--radius-app)] border border-line p-3.5 bg-surface-2/50">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `color-mix(in srgb, ${primary} 15%, white)`,
                      color: primary,
                    }}
                  >
                    Trust Verification Stage
                  </span>
                  <p className="mt-2 text-[13.5px] font-semibold text-ink">
                    Publish monthly open agenda & budget allocation
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2.5">
                    {features.includes("budgeting") ? (
                      <span
                        className="flex items-center gap-1 text-[12px] font-mono font-medium"
                        style={{ color: accent }}
                      >
                        <Wallet size={12} /> ₹1,20,000
                      </span>
                    ) : (
                      <span className="text-[11px] text-ink-3">
                        {constituency} 1
                      </span>
                    )}
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{ background: primary, color: "#fff" }}
                    >
                      84 votes
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {features.slice(0, 6).map((f) => (
                    <span
                      key={f}
                      className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-3 border border-line/50"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="mt-5 w-full shadow-md"
              size="lg"
              disabled={!name.trim() || !slug.trim() || creating}
              onClick={create}
            >
              {creating ? (
                <>
                  <Loader2 size={17} className="animate-spin mr-2" />
                  Provisioning Portal…
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-2" />
                  Launch Tenant Portal
                </>
              )}
            </Button>
            <p className="mt-2 text-center font-mono text-[11px] text-ink-3">
              goes live at /t/{slug || "slug"}/proposals instantly
            </p>
          </aside>
        </div>
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
      type="button"
      onClick={onClick}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full transition-transform hover:scale-110",
        active && "ring-2 ring-offset-2 ring-offset-paper ring-primary",
      )}
      style={{ background: color }}
      aria-label={color}
    >
      {active && <Check size={14} className="text-white" strokeWidth={3} />}
    </button>
  );
}
