"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Users, Video, Wallet } from "lucide-react";
import { useLang } from "@/context/LanguageContext";
import type { ProposalView } from "@/lib/data";
import { PipelineStrip } from "@/components/pipeline";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DuoModal } from "@/components/duo-modal";
import { VerifyProposalModal } from "@/components/verify-proposal-modal";
import { formatINR } from "@/lib/utils";
import type { Tenant } from "@/lib/tenant";

/** Set by /signup and /login when the person enters a name — see app/signup/signup-client.tsx. */
function readDisplayNameCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)cin_display_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function ProposalDetailClient({
  tenant,
  proposalId,
}: {
  tenant: Tenant;
  proposalId: string;
}) {
  const { t } = useLang();
  const [p, setP] = useState<ProposalView | null | undefined>(undefined);
  const [duoOpen, setDuoOpen] = useState(false);
  const [justVoted, setJustVoted] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [justCreatedRoom, setJustCreatedRoom] = useState<{ roomUrl: string | null } | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const hasBudgeting = tenant.features.includes("budgeting");

  useEffect(() => {
    setP(undefined);
    fetch(`/api/t/${tenant.slug}/proposals/${proposalId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => setP(res));
  }, [tenant.slug, proposalId]);

  async function onVerified() {
    if (!p) return;
    setVoteError(null);
    try {
      const res = await fetch(`/api/t/${tenant.slug}/proposals/${proposalId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: readDisplayNameCookie() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVoteError(data?.error ?? "Couldn't record that vote — try again.");
        setDuoOpen(false);
        return;
      }
      if (data.proposal) setP(data.proposal);
      setJustVoted(true);
      if (data.webex?.created) {
        setJustCreatedRoom({ roomUrl: data.webex.roomUrl ?? null });
      }
    } catch {
      setVoteError("Couldn't reach the server — try again.");
    } finally {
      setDuoOpen(false);
    }
  }

  if (p === undefined) return <DetailSkeleton />;
  if (p === null)
    return (
      <div className="py-24 text-center">
        <p className="text-sm font-medium text-ink">Proposal not found.</p>
        <Link href={`/t/${tenant.slug}/proposals`} className="mt-2 inline-block text-sm text-primary">
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
      <Link
        href={`/t/${tenant.slug}/proposals`}
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft size={15} />
        {t("nav.feed")}
      </Link>

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

          {p.stage === "verification" && p.verificationPhoto && (
            <div className="mt-8 rounded-[calc(var(--radius-app)+2px)] border border-ok/25 bg-ok/6 p-5">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-ok/15 text-ok">
                  <ShieldCheck size={15} />
                </span>
                <p className="text-[13.5px] font-semibold text-ink">Verified outcome</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.verificationPhoto}
                alt="Proof the proposal's outcome was completed"
                className="mt-3 max-h-96 w-full rounded-[var(--radius-app)] object-cover"
              />
              {p.verificationNote && (
                <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{p.verificationNote}</p>
              )}
              <p className="mt-3 font-mono text-[11px] text-ink-3">
                Recorded by {p.verifiedBy || "a CIN member"}
                {p.verifiedAt &&
                  ` · ${new Date(p.verifiedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`}
              </p>
            </div>
          )}
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
              {voteError && (
                <p className="mt-2 text-center text-[12px] font-medium text-danger">
                  {voteError}
                </p>
              )}
            </div>

            {p.webexRoomId && (
              <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-app)] border border-primary/25 bg-primary-soft px-3 py-2.5">
                <Video size={15} className="mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-primary-strong">
                    Webex room open
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-ink-2">
                    This proposal crossed the vote threshold — a Webex space was created and routed to the body that can act on it.
                  </p>
                  {p.webexRoomUrl ? (
                    <a
                      href={p.webexRoomUrl}
                      className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-primary underline underline-offset-2"
                    >
                      Open in Webex
                    </a>
                  ) : (
                    <p className="mt-1.5 text-[11px] text-ink-3">
                      Check your Webex app — it's in your spaces list.
                    </p>
                  )}
                </div>
              </div>
            )}

            {p.stage === "trigger" && (
              <div className="mt-4 rounded-[var(--radius-app)] border border-line-strong bg-surface-2 px-3 py-3">
                <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
                  <ShieldCheck size={14} className="text-primary" />
                  Was this completed?
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-ink-2">
                  Upload proof and move this proposal to the Verification stage.
                </p>
                <Button size="sm" className="mt-2.5 w-full" onClick={() => setVerifyOpen(true)}>
                  Mark as verified
                </Button>
              </div>
            )}

            {hasBudgeting && p.budgetAsk && (
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
              <Link href={`/t/${tenant.slug}/tally`} className="font-medium text-primary underline">
                live tally
              </Link>
              .
            </p>
          )}

          {justCreatedRoom && (
            <p className="mt-2 text-center text-[12px] font-medium text-primary animate-[fade_300ms_ease]">
              🎉 That vote crossed the threshold — a Webex room was just created for this proposal.
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

      <VerifyProposalModal
        tenant={tenant}
        proposalId={proposalId}
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerifiedProposal={(updated) => setP(updated)}
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
