"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import type { ProposalView } from "@/lib/data";
import { PIPELINE, type StageId } from "@/lib/pipeline";
import { ProposalCard } from "@/components/proposal-card";
import { SlidoEmbed } from "@/components/slido-embed";
import { NewProposalModal } from "@/components/new-proposal-modal";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/tenant";

type SortKey = "votes" | "newest";
type StageFilter = "all" | StageId;

export function ProposalsView({ tenant }: { tenant: Tenant }) {
  const { t } = useLang();
  const [items, setItems] = useState<ProposalView[] | null>(null);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");
  const [sort, setSort] = useState<SortKey>("votes");
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    setItems(null);
    fetch(`/api/t/${tenant.slug}/proposals`)
      .then((r) => r.json())
      .then(setItems);
  }, [tenant.slug]);

  const filtered = useMemo(() => {
    if (!items) return [];
    return items
      .filter((p) => (stage === "all" ? true : p.stage === stage))
      .filter((p) =>
        q.trim()
          ? (p.title + p.summary + p.tags.join(" "))
              .toLowerCase()
              .includes(q.toLowerCase())
          : true,
      )
      .sort((a, b) =>
        sort === "votes"
          ? b.votes - a.votes
          : b.createdAt.localeCompare(a.createdAt),
      );
  }, [items, q, stage, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">
            {t("feed.heading")}
          </h1>
          <p className="mt-1 text-[14px] text-ink-2">{t("feed.sub")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 font-mono text-[11px] text-ink-3">
            <span className="rounded-md bg-surface-2 px-2 py-1">
              {items?.length ?? "–"} proposals
            </span>
            <span className="rounded-md bg-surface-2 px-2 py-1">
              {tenant.constituencyLabel.toLowerCase()}-scoped
            </span>
          </div>
          <Button size="sm" onClick={() => setNewOpen(true)}>
            <Plus size={15} />
            New Proposal
          </Button>
        </div>
      </div>

      {/* Slido live poll — above the proposals list, shown for every tenant once SLIDO_EVENT_ID is configured */}
      <div className="mt-6">
        <SlidoEmbed />
      </div>

      {/* controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search proposals…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-[var(--radius-app)] border border-line bg-surface p-1">
          {(["votes", "newest"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cn(
                "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                sort === k
                  ? "bg-primary-soft text-primary-strong"
                  : "text-ink-3 hover:text-ink",
              )}
            >
              {k === "votes" ? "Most supported" : "Newest"}
            </button>
          ))}
        </div>
      </div>

      {/* stage filter row */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StagePill active={stage === "all"} onClick={() => setStage("all")}>
          All stages
        </StagePill>
        {PIPELINE.map((s) => (
          <StagePill
            key={s.id}
            active={stage === s.id}
            onClick={() => setStage(s.id)}
          >
            {s.label}
          </StagePill>
        ))}
      </div>

      {/* grid */}
      {items === null ? (
        <FeedSkeleton />
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm font-medium text-ink">No proposals match.</p>
          <p className="mt-1 text-[13px] text-ink-3">
            Try clearing the search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProposalCard key={p.id} p={p} tenant={tenant} />
          ))}
        </div>
      )}

      <NewProposalModal
        tenant={tenant}
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(p) => setItems((prev) => (prev ? [p, ...prev] : [p]))}
      />
    </div>
  );
}

function StagePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-line bg-surface text-ink-2 hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}

function FeedSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface-2"
        />
      ))}
    </div>
  );
}
