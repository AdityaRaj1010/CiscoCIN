import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Users, Wallet } from "lucide-react";
import { useTenant } from "@/context/TenantContext";
import { useSession } from "@/context/SessionContext";
import { useLang } from "@/context/LanguageContext";
import {
  proposals,
  votes as votesApi,
  AlreadyVotedError,
  type ProposalView,
} from "@/api";
import { PipelineStrip } from "@/components/pipeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DuoModal } from "@/components/duo-modal";
import { formatINR } from "@/lib/utils";

export function ProposalDetailPage() {
  const { id = "" } = useParams();
  const { tenant, hasFeature } = useTenant();
  const { user } = useSession();
  const { t } = useLang();
  const navigate = useNavigate();

  const [p, setP] = useState<ProposalView | null | undefined>(undefined);
  const [duoOpen, setDuoOpen] = useState(false);
  const [casting, setCasting] = useState(false);
  const [justVoted, setJustVoted] = useState(false);

  useEffect(() => {
    setP(undefined);
    proposals.get(tenant.id, id, user?.id).then((res) => setP(res));
  }, [tenant.id, id, user?.id]);

  async function onVerified() {
    if (!p || !user) return;
    setCasting(true);
    try {
      const updated = await votesApi.cast(tenant.id, p.id, user.id);
      setP(updated);
      setJustVoted(true);
    } catch (e) {
      if (e instanceof AlreadyVotedError && p) {
        setP({ ...p, votedByCurrentUser: true });
      }
    } finally {
      setCasting(false);
      setDuoOpen(false);
    }
  }

  if (p === undefined) return <DetailSkeleton />;
  if (p === null)
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-ink">Proposal not found.</p>
        <Link to="/feed" className="mt-2 inline-block text-sm text-primary">
          Back to proposals
        </Link>
      </div>
    );

  const voted = p.votedByCurrentUser;
  const topGroups = Object.entries(p.votesByConstituency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxGroup = Math.max(...topGroups.map(([, n]) => n), 1);

  return (
    <div>
      <button
        onClick={() => navigate("/feed")}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        {t("nav.feed")}
      </button>

      <PipelineStrip stage={p.stage} />

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* main */}
        <article>
          <div className="flex flex-wrap gap-1.5">
            {p.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-surface-2 px-2 py-0.5 font-mono text-[11px] lowercase text-ink-3"
              >
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="mt-3 font-display text-[30px] font-semibold leading-[1.15] tracking-tight text-ink">
            {p.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 border-b border-line pb-6">
            <Avatar
              initials={p.authorName
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
              name={p.authorName}
              className="h-10 w-10"
            />
            <div>
              <p className="text-sm font-medium text-ink">{p.authorName}</p>
              <p className="text-[12px] text-ink-3">
                {tenant.constituencyLabel} · {p.constituency} ·{" "}
                {new Date(p.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                })}
              </p>
            </div>
          </div>

          <p className="mt-6 text-[15px] font-medium leading-relaxed text-ink">
            {p.summary}
          </p>
          <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
            {p.body}
          </p>
        </article>

        {/* vote rail */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-[calc(var(--radius-app)+4px)] border border-line bg-surface p-5">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl font-semibold tabular text-ink">
                {p.votes.toLocaleString()}
              </span>
              <span className="text-sm text-ink-3">{t("common.votes")}</span>
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-ink-3">
              <Users size={13} className="text-primary" />
              endorsed across {tenant.constituencyLabel.toLowerCase()}s
            </p>

            <div className="mt-4">
              {voted ? (
                <div className="flex items-center justify-center gap-2 rounded-[var(--radius-app)] border border-ok/30 bg-ok/8 py-2.5 text-sm font-semibold text-ok animate-[pop_220ms_ease]">
                  <Check size={17} strokeWidth={2.5} />
                  {t("action.supported")}
                </div>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={casting}
                  onClick={() => setDuoOpen(true)}
                >
                  {t("action.vote")}
                </Button>
              )}
              <p className="mt-2 text-center font-mono text-[11px] text-ink-3">
                {voted
                  ? "one vote per member · recorded"
                  : "MFA-verified · one vote per member"}
              </p>
            </div>

            {hasFeature("participatory_budgeting") && p.budgetAsk && (
              <div className="mt-4 flex items-center justify-between rounded-[var(--radius-app)] bg-accent-soft px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-accent-foreground">
                  <Wallet size={14} />
                  Budget ask
                </span>
                <span className="font-mono text-sm font-semibold text-accent-foreground">
                  {formatINR(p.budgetAsk)}
                </span>
              </div>
            )}

            {/* live breakdown by constituency */}
            <div className="mt-5 border-t border-line pt-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wide text-ink-3">
                Support by {tenant.constituencyLabel.toLowerCase()}
              </p>
              <div className="space-y-2.5">
                {topGroups.map(([name, n]) => (
                  <div key={name}>
                    <div className="mb-1 flex items-center justify-between text-[12px]">
                      <span className="truncate text-ink-2">{name}</span>
                      <span className="tabular font-medium text-ink">{n}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary transition-[width] duration-500"
                        style={{ width: `${(n / maxGroup) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {justVoted && (
            <p className="mt-3 text-center text-[12px] text-ink-3 animate-[fade_300ms_ease]">
              Your vote updated the{" "}
              <Link to="/tally" className="font-medium text-primary underline">
                live tally
              </Link>
              .
            </p>
          )}
        </aside>
      </div>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={onVerified}
        title="Authorize your vote"
        context={`Voting on "${p.title.slice(0, 40)}${p.title.length > 40 ? "…" : ""}"`}
      />
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-16 rounded-[calc(var(--radius-app)+2px)] bg-surface-2" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="h-9 w-3/4 rounded bg-surface-2" />
          <div className="h-4 w-1/3 rounded bg-surface-2" />
          <div className="mt-6 h-40 rounded bg-surface-2" />
        </div>
        <div className="h-64 rounded-[calc(var(--radius-app)+4px)] bg-surface-2" />
      </div>
    </div>
  );
}
