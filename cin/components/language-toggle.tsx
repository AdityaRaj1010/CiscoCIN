"use client";

import { useEffect, useRef, useState } from "react";
import { Languages, Check } from "lucide-react";
import { LANGUAGES, useLang } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

/** Bhashini language switcher — rendered only for multilingual tenants. */
export function LanguageToggle() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.id === lang)!;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-[var(--radius-app)] border border-line-strong bg-surface px-2.5 text-[13px] text-ink-2 transition-colors hover:bg-surface-2"
      >
        <Languages size={15} className="text-primary" />
        <span className="font-medium text-ink">{current.native}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-44 overflow-hidden rounded-lg border border-line bg-surface p-1 shadow-xl shadow-system/10">
          <div className="flex items-center gap-1.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-3">
            <span>Bhashini</span>
            <span className="h-1 w-1 rounded-full bg-accent" />
            <span>translate</span>
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.id}
              onClick={() => {
                setLang(l.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-[13px] transition-colors hover:bg-surface-2",
                l.id === lang ? "text-ink" : "text-ink-2",
              )}
            >
              <span>
                <span className="font-medium">{l.native}</span>
                <span className="ml-1.5 text-ink-3">{l.label}</span>
              </span>
              {l.id === lang && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
