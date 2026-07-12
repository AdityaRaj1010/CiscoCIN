import { Check } from "lucide-react";
import { PIPELINE, STAGE_INDEX, STAGE_BY_ID, type StageId } from "@/config/pipeline";
import { cn } from "@/lib/utils";

/** Compact chip for feed cards — "stage 3/4 · Trigger to Action". */
export function StageChip({ stage }: { stage: StageId }) {
  const idx = STAGE_INDEX[stage];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-ink-2">
      <span className="flex gap-0.5" aria-hidden>
        {PIPELINE.map((s, i) => (
          <span
            key={s.id}
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i <= idx ? "bg-primary" : "bg-line-strong",
            )}
          />
        ))}
      </span>
      <span className="font-mono text-[10px] text-ink-3">{idx + 1}/4</span>
      {STAGE_BY_ID[stage].label}
    </span>
  );
}

/** Full OS-style status strip for the detail view. */
export function PipelineStrip({ stage }: { stage: StageId }) {
  const active = STAGE_INDEX[stage];
  return (
    <div className="rounded-[calc(var(--radius-app)+2px)] border border-line bg-surface p-1.5">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-stretch">
        {PIPELINE.map((s, i) => {
          const state =
            i < active ? "done" : i === active ? "current" : "todo";
          return (
            <div
              key={s.id}
              className={cn(
                "relative flex-1 rounded-[var(--radius-app)] px-3 py-2.5 transition-colors",
                state === "current" && "bg-primary-soft",
                state === "done" && "bg-surface-2",
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full font-mono text-[10px] font-semibold",
                    state === "current" &&
                      "bg-primary text-primary-foreground",
                    state === "done" && "bg-primary/85 text-primary-foreground",
                    state === "todo" && "bg-surface-2 text-ink-3",
                  )}
                >
                  {state === "done" ? <Check size={11} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[12px] font-semibold leading-tight",
                    state === "current" ? "text-primary-strong" : "text-ink",
                    state === "todo" && "text-ink-3",
                  )}
                >
                  {s.label}
                </span>
              </div>
              {state === "current" && (
                <p className="mt-1 pl-7 text-[11px] leading-snug text-ink-2">
                  {s.blurb}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
