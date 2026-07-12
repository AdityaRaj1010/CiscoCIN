import { cn } from "@/lib/utils";

/** Deterministic soft background per name so avatars are stable across renders. */
const TONES = [
  "bg-[#e7edff] text-[#2a44b8]",
  "bg-[#e4f6ec] text-[#166b45]",
  "bg-[#fdeede] text-[#9a5411]",
  "bg-[#f1e8fb] text-[#6b3fa0]",
  "bg-[#fde8ec] text-[#a83552]",
];

export function Avatar({
  initials,
  name,
  className,
}: {
  initials: string;
  name?: string;
  className?: string;
}) {
  const key = (name ?? initials)
    .split("")
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  const tone = TONES[key % TONES.length];
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full text-[12px] font-semibold",
        tone,
        className,
      )}
    >
      {initials}
    </span>
  );
}
