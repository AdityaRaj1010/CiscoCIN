import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Crown } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useSession } from "@/context/SessionContext";
import { useLang } from "@/context/LanguageContext";
import { tally, type TallyData } from "@/api";
import { StageChip } from "@/components/pipeline";
import { cn } from "@/lib/utils";

/** Ease a displayed number toward a target for a live "ticking" feel. */
function useCountUp(target: number, ms = 600) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const startVal = from.current;
    const delta = target - startVal;
    if (delta === 0) return;
    function tick(now: number) {
      const p = Math.min((now - start) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(startVal + delta * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, ms]);
  return value;
}

const GROUP_TONES = [
  "var(--primary)",
  "color-mix(in srgb, var(--primary) 78%, var(--accent))",
  "color-mix(in srgb, var(--primary) 55%, var(--accent))",
  "var(--accent)",
  "color-mix(in srgb, var(--accent) 70%, white)",
];

export function TallyPage() {
  const { tenant } = useTenant();
  const { user } = useSession();
  const { t } = useLang();
  const [data, setData] = useState<TallyData | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      tally.get(tenant, user?.id).then((d) => active && setData(d));
    load();
    // realtime-feel: re-read the store on an interval so votes cast elsewhere
    // (or on the detail page) tick in live.
    const iv = window.setInterval(load, 2500);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [tenant.id, user?.id]);

  const total = useCountUp(data?.totalVotes ?? 0);

  if (!data) return <TallySkeleton />;

  const maxGroup = Math.max(...data.groups.map((g) => g.votes), 1);
  const maxRanked = data.ranked[0]?.votes ?? 1;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok/70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ok" />
            </span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-ok">
              Live
            </span>
          </div>
          <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink">
            {t("tally.heading")}
          </h1>
          <p className="mt-1 text-[14px] text-ink-2">
            Endorsements across every {tenant.constituencyLabel.toLowerCase()},
            updating as votes come in.
          </p>
        </div>
        <div className="rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface px-5 py-3 text-right">
          <div className="font-display text-4xl font-semibold tabular text-ink">
            {total.toLocaleString()}
          </div>
          <div className="flex items-center justify-end gap-1 font-mono text-[11px] text-ink-3">
            <Activity size={12} className="text-primary" />
            total {t("common.votes")} · {data.totalProposals} proposals
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* by constituency */}
        <section className="rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-ink">
            By {tenant.constituencyLabel.toLowerCase()}
          </h2>
          <p className="mb-5 font-mono text-[11px] text-ink-3">
            group participation
          </p>
          <div className="space-y-4">
            {data.groups.map((g, i) => (
              <div key={g.constituency}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-ink">{g.constituency}</span>
                  <span className="tabular font-semibold text-ink">
                    {g.votes.toLocaleString()}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${(g.votes / maxGroup) * 100}%`,
                      background: GROUP_TONES[i % GROUP_TONES.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* leaderboard */}
        <section className="rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface p-5">
          <h2 className="font-display text-sm font-semibold text-ink">
            Most supported
          </h2>
          <p className="mb-5 font-mono text-[11px] text-ink-3">
            ranked by endorsements
          </p>
          <ol className="space-y-2.5">
            {data.ranked.slice(0, 6).map((p, i) => (
              <li key={p.id}>
                <Link
                  to={`/p/${p.id}`}
                  className="group block rounded-[var(--radius-app)] border border-transparent p-2.5 transition-colors hover:border-line hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid h-6 w-6 shrink-0 place-items-center rounded-md font-mono text-[11px] font-semibold",
                        i === 0
                          ? "bg-accent text-accent-foreground"
                          : "bg-surface-2 text-ink-3",
                      )}
                    >
                      {i === 0 ? <Crown size={12} /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-[13.5px] font-medium text-ink group-hover:text-primary-strong">
                        {p.title}
                      </span>
                    </span>
                    <span className="tabular text-[13px] font-semibold text-ink">
                      {p.votes.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 pl-9">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-700"
                        style={{ width: `${(p.votes / maxRanked) * 100}%` }}
                      />
                    </div>
                    <StageChip stage={p.stage} />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

function TallySkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-20 w-1/2 rounded bg-surface-2" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-[calc(var(--radius-app)+2px)] bg-surface-2" />
        <div className="h-80 rounded-[calc(var(--radius-app)+2px)] bg-surface-2" />
      </div>
    </div>
  );
}
