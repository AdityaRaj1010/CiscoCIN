"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui/modal";

type Phase = "pushing" | "approved";

interface DuoModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  context?: string;
}

/**
 * Simulated Duo push MFA. Sits behind the same seam a real Duo Web SDK call
 * would: open it, and it resolves onVerified() after a mock push-approval.
 * Not dismissible while the push is in flight — matching real MFA.
 */
export function DuoModal({
  open,
  onClose,
  onVerified,
  title = "Verify it's you",
  context,
}: DuoModalProps) {
  const [phase, setPhase] = useState<Phase>("pushing");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhase("pushing");
    const t1 = window.setTimeout(() => setPhase("approved"), 1700);
    const t2 = window.setTimeout(() => {
      onVerified();
    }, 2500);
    timers.current = [t1, t2];
    return () => timers.current.forEach(clearTimeout);
  }, [open, onVerified]);

  return (
    <Modal open={open} onClose={onClose} dismissible={false} className="max-w-sm">
      <div className="flex flex-col items-center px-8 py-9 text-center">
        <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-3">
          <ShieldCheck size={13} className="text-ok" />
          Duo Security
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold text-ink">
          {title}
        </h2>
        {context && (
          <p className="mt-1.5 text-[13px] text-ink-2">{context}</p>
        )}

        <div className="relative my-8 grid h-28 w-28 place-items-center">
          {phase === "pushing" ? (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-primary/15" />
              <span
                className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
                style={{ animation: "spin 900ms linear infinite" }}
              />
              <Smartphone size={34} className="text-primary" />
            </>
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-ok/12 text-ok animate-[pop_240ms_cubic-bezier(0.2,0.9,0.3,1)]">
              <Check size={40} strokeWidth={2.5} />
            </div>
          )}
        </div>

        <p className="text-sm font-medium text-ink">
          {phase === "pushing"
            ? "Approve the push on your device"
            : "Approved — you're verified"}
        </p>
        <p className="mt-1 font-mono text-[11px] text-ink-3">
          {phase === "pushing"
            ? "Sent to iPhone · Duo Mobile"
            : "MFA satisfied"}
        </p>
      </div>
    </Modal>
  );
}
