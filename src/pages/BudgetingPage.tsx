import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useSession } from "@/context/SessionContext";
import { proposals, type ProposalView } from "@/api";
import { formatINR } from "@/lib/utils";

/** A shared demo pool that participatory budgeting allocates against. */
const POOL = 2000000;

export function BudgetingPage() {
  const { tenant } = useTenant();
  const { user } = useSession();
  const [items, setItems] = useState<ProposalView[] | null>(null);

  useEffect(() => {
    proposals.list(tenant.id, user?.id).then(setItems);
  }, [tenant.id, user?.id]);

  const withBudget = useMemo(
    () =>
      (items ?? [])
        .filter((p) => p.budgetAsk)
        .sort((a, b) => b.votes - a.votes),
    [items],
  );

  const totalAsk = withBudget.reduce((s, p) => s + (p.budgetAsk ?? 0), 0);
  const totalVotes = withBudget.reduce((s, p) => s + p.votes, 0) || 1;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Wallet size={16} className="text-accent" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-3">
          participatory budgeting
        </span>
      </div>
      <h1 className="mt-2 font-display text-[26px] font-semibold tracking-tight text-ink">
        Allocate the shared pool
      </h1>
      <p className="mt-1 text-[14px] text-ink-2">
        Proposals draw from one pool. Support shifts each proposal's share —
        this is where votes turn into money.
      </p>

      {/* pool bar */}
      <div className="mt-6 rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <span className="text-[13px] font-medium text-ink">
            Pool utilisation
          </span>
          <span className="font-mono text-[13px] text-ink-2">
            <span className="font-semibold text-ink">{formatINR(totalAsk)}</span>{" "}
            requested of {formatINR(POOL)}
          </span>
        </div>
        <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-surface-2">
          {withBudget.map((p, i) => (
            <div
              key={p.id}
              title={`${p.title} · ${formatINR(p.budgetAsk ?? 0)}`}
              className="h-full border-r-2 border-surface transition-[width] duration-500"
              style={{
                width: `${((p.budgetAsk ?? 0) / POOL) * 100}%`,
                background: `color-mix(in srgb, var(--primary) ${90 - i * 10}%, var(--accent))`,
              }}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-ink-3">
          {totalAsk > POOL
            ? "over-subscribed — voting decides priority"
            : `${formatINR(POOL - totalAsk)} unallocated`}
        </p>
      </div>

      {/* allocation table */}
      <div className="mt-6 overflow-hidden rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-ink-3">
          <span>Proposal</span>
          <span className="text-right">Ask</span>
          <span className="w-28 text-right">Vote share</span>
        </div>
        {withBudget.map((p) => {
          const share = (p.votes / totalVotes) * 100;
          return (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-line px-5 py-3.5 transition-colors last:border-0 hover:bg-surface-2"
            >
              <span className="min-w-0">
                <span className="line-clamp-1 text-[13.5px] font-medium text-ink">
                  {p.title}
                </span>
                <span className="text-[11px] text-ink-3">{p.constituency}</span>
              </span>
              <span className="text-right font-mono text-[13px] font-semibold text-accent-foreground">
                {formatINR(p.budgetAsk ?? 0)}
              </span>
              <span className="flex w-28 items-center justify-end gap-2">
                <span className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-2">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${share}%` }}
                  />
                </span>
                <span className="tabular w-9 text-right text-[12px] font-medium text-ink">
                  {share.toFixed(0)}%
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
