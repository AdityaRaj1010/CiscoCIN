"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** hide the close button for uninterruptible flows (e.g. MFA in progress) */
  dismissible?: boolean;
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  dismissible = true,
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && dismissible) onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, dismissible]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      <div
        className="absolute inset-0 bg-system/55 backdrop-blur-sm animate-[fade_160ms_ease]"
        onClick={() => dismissible && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-system/30 animate-[pop_180ms_cubic-bezier(0.2,0.9,0.3,1)]",
          className,
        )}
      >
        {dismissible && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
