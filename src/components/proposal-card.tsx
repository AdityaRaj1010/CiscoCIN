import { Link } from "react-router-dom";
import { ArrowUpRight, Users, Wallet } from "lucide-react";
import type { ProposalView } from "@/api";
import { useTenant } from "@/context/TenantContext";
import { useLang } from "@/context/LanguageContext";
import { Avatar } from "@/components/ui/avatar";
import { StageChip } from "@/components/pipeline";
import { compactNumber, formatINR } from "@/lib/utils";

export function ProposalCard({ p }: { p: ProposalView }) {
  const { hasFeature, tenant } = useTenant();
  const { t } = useLang();

  return (
    <Link
      to={`/p/${p.id}`}
      className="group flex flex-col rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface p-5 transition-all hover:border-line-strong hover:shadow-[0_1px_0_var(--line),0_8px_24px_-16px_rgba(20,22,29,0.25)]"
    >
      <div className="flex items-start justify-between gap-3">
        <StageChip stage={p.stage} />
        <ArrowUpRight
          size={16}
          className="mt-0.5 shrink-0 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
        />
      </div>

      <h3 className="mt-3 font-display text-[17px] font-semibold leading-snug text-ink">
        {p.title}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">
        {p.summary}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {p.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] lowercase text-ink-3"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        <Avatar
          initials={p.authorName
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
          name={p.authorName}
          className="h-6 w-6 text-[10px]"
        />
        <span className="min-w-0 truncate text-[12px] text-ink-2">
          {p.authorName}
          <span className="text-ink-3">
            {" · "}
            {p.constituency}
          </span>
        </span>

        <span className="ml-auto flex items-center gap-3">
          {hasFeature("participatory_budgeting") && p.budgetAsk && (
            <span
              className="flex items-center gap-1 font-mono text-[12px] text-ink-2"
              title={`Budget ask · ${tenant.constituencyLabel}`}
            >
              <Wallet size={13} className="text-accent" />
              {formatINR(p.budgetAsk)}
            </span>
          )}
          <span className="flex items-center gap-1 text-[13px] font-semibold text-ink tabular">
            <Users size={13} className="text-primary" />
            {compactNumber(p.votes)}
            <span className="font-normal text-ink-3">{t("common.votes")}</span>
          </span>
        </span>
      </div>
    </Link>
  );
}
