import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-1.5 flex items-center justify-between text-[13px] font-medium text-ink">
      <span>{children}</span>
      {hint && <span className="font-mono text-[11px] text-ink-3">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-[var(--radius-app)] border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-app)] border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
        className,
      )}
      {...props}
    />
  );
}
