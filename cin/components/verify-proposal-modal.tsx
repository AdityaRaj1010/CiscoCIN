"use client";

import { useRef, useState } from "react";
import { Camera, ShieldCheck, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { DuoModal } from "@/components/duo-modal";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/field";
import type { ProposalView } from "@/lib/data";
import type { Tenant } from "@/lib/tenant";

/** Set by /signup and /login when the person enters a name. */
function readDisplayNameCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)cin_display_name=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

const NOTE_MAX = 600;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

/**
 * Downscales + re-encodes a photo client-side before it ever leaves the
 * browser. There's no object-storage bucket wired into this project, so
 * the photo is stored as a data URL straight in the proposals row — this
 * keeps that row small (a modern phone photo is often 4-8MB; this brings
 * it down to a few hundred KB) regardless of what the person picked.
 */
function downscalePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function VerifyProposalModal({
  tenant,
  proposalId,
  open,
  onClose,
  onVerifiedProposal,
}: {
  tenant: Tenant;
  proposalId: string;
  open: boolean;
  onClose: () => void;
  onVerifiedProposal: (p: ProposalView) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [duoOpen, setDuoOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setPhotoDataUrl(null);
    setNote("");
    setError(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await downscalePhoto(file);
      setPhotoDataUrl(dataUrl);
    } catch (err: any) {
      setError(err.message || "Couldn't process that photo — try another.");
    }
  }

  async function submit() {
    if (!photoDataUrl) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/t/${tenant.slug}/proposals/${proposalId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo: photoDataUrl,
          note: note.trim(),
          name: readDisplayNameCookie(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Couldn't record verification — try again.");
        setSubmitting(false);
        return;
      }
      onVerifiedProposal(data.proposal);
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
              <ShieldCheck size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">Mark as verified</h2>
          </div>
          <p className="mt-1.5 text-[13px] text-ink-2">
            Upload real proof the outcome happened — a photo of the completed work. This is what actually moves the proposal to the <span className="font-medium text-ink">Verification</span> stage.
          </p>

          <div className="mt-5 space-y-4">
            <section>
              <Label>Proof-of-completion photo</Label>
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={onPickFile}
                className="hidden"
              />
              {photoDataUrl ? (
                <button
                  onClick={() => fileInput.current?.click()}
                  className="group relative block w-full overflow-hidden rounded-[var(--radius-app)] border border-line-strong"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoDataUrl} alt="Proof of completion" className="max-h-64 w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-system/0 text-[13px] font-medium text-white opacity-0 transition-all group-hover:bg-system/40 group-hover:opacity-100">
                    Change photo
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => fileInput.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-app)] border border-dashed border-line-strong bg-surface-2 py-8 text-ink-3 transition-colors hover:border-primary hover:text-primary"
                >
                  <Camera size={22} />
                  <span className="text-[13px] font-medium">Take or upload a photo</span>
                </button>
              )}
            </section>
            <section>
              <Label hint={`optional · ${note.length}/${NOTE_MAX}`}>What was done</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                placeholder="e.g. New access points installed in both hostel blocks on 14 July; signal tested from every floor."
                rows={3}
              />
            </section>
          </div>

          {error && <p className="mt-4 text-[12.5px] font-medium text-danger">{error}</p>}

          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!photoDataUrl || submitting}
            onClick={() => setDuoOpen(true)}
          >
            <Upload size={16} />
            {submitting ? "Recording…" : "Verify and submit"}
          </Button>
          <p className="mt-2 text-center font-mono text-[11px] text-ink-3">
            MFA-verified · recorded permanently on this proposal
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
        title="Confirm outcome verification"
        context="Recording this proposal as completed"
      />
    </>
  );
}
