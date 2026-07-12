"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { DuoModal } from "@/components/duo-modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import type { ProposalView } from "@/lib/data";
import type { Tenant } from "@/lib/tenant";

/** Set by /signup and /login when the person enters a name. */
function readDisplayNameCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)cin_display_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

const BODY_MIN = 20;
const TITLE_MAX = 140;
const BODY_MAX = 4000;

export function NewProposalModal({
  tenant,
  open,
  onClose,
  onCreated,
}: {
  tenant: Tenant;
  open: boolean;
  onClose: () => void;
  onCreated: (p: ProposalView) => void;
}) {
  const hasBudgeting = tenant.features.includes("budgeting");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [constituency, setConstituency] = useState("");
  const [budgetAsk, setBudgetAsk] = useState("");
  const [duoOpen, setDuoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = title.trim().length > 0 && title.trim().length <= TITLE_MAX && body.trim().length >= BODY_MIN;

  function reset() {
    setTitle("");
    setBody("");
    setConstituency("");
    setBudgetAsk("");
    setError(null);
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/t/${tenant.slug}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          constituency: constituency.trim() || undefined,
          budgetAsk: hasBudgeting && budgetAsk ? Number(budgetAsk) : undefined,
          name: readDisplayNameCookie(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Couldn't submit that proposal — try again.");
        setSubmitting(false);
        return;
      }
      onCreated(data.proposal);
      reset();
      setSubmitting(false);
      onClose();
    } catch {
      setError("Couldn't reach the server — try again.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <Modal open={open} onClose={handleClose} className="max-w-lg">
        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-soft text-primary-strong">
              <Plus size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">New proposal</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-2">
            Goes live at the <span className="font-medium text-ink">Notice</span> stage of the pipeline — every member can see, discuss, and endorse it right away.
          </p>

          <div className="mt-5 space-y-4">
            <section>
              <Label hint={`${title.length}/${TITLE_MAX}`}>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                placeholder="e.g. Extend library hours during exam week"
                autoFocus
              />
            </section>
            <section>
              <Label hint={`${body.length}/${BODY_MAX}`}>Description</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, BODY_MAX))}
                placeholder="What are you proposing, and why does it matter? Be specific — this is what people will vote on."
                rows={5}
              />
            </section>
            <section>
              <Label hint="optional">{tenant.constituencyLabel}</Label>
              <Input
                value={constituency}
                onChange={(e) => setConstituency(e.target.value)}
                placeholder={`Defaults to "${tenant.constituencyLabel}" if left blank`}
              />
            </section>
            {hasBudgeting && (
              <section>
                <Label hint="optional · ₹">Budget ask</Label>
                <Input
                  type="number"
                  min={0}
                  value={budgetAsk}
                  onChange={(e) => setBudgetAsk(e.target.value)}
                  placeholder="e.g. 25000"
                />
              </section>
            )}
          </div>

          {error && <p className="mt-4 text-[12.5px] font-medium text-danger">{error}</p>}

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!canSubmit || submitting}
            onClick={() => setDuoOpen(true)}
          >
            {submitting ? "Submitting…" : "Verify and submit"}
          </Button>
          <p className="mt-2 text-center font-mono text-[11px] text-ink-3">
            MFA-verified · attributed to your CIN identity
          </p>
        </div>
      </Modal>

      <DuoModal
        open={duoOpen}
        onClose={() => setDuoOpen(false)}
        onVerified={() => {
          setDuoOpen(false);
          submit();
        }}
        title="Confirm this proposal"
        context={title ? `Submitting "${title.slice(0, 40)}${title.length > 40 ? "…" : ""}"` : undefined}
      />
    </>
  );
}
