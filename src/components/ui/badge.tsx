import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-surface-2 text-ink-2 border border-line",
        primary: "bg-primary-soft text-primary-strong",
        accent: "bg-accent-soft text-accent-foreground",
        ok: "bg-[color-mix(in_srgb,var(--ok)_14%,white)] text-ok",
        warn: "bg-[color-mix(in_srgb,var(--warn)_16%,white)] text-warn",
        outline: "border border-line-strong text-ink-2",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}
