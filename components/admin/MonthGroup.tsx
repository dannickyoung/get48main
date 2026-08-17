import type { ReactNode } from "react";

/**
 * A collapsible month section: a header row with the month, a short summary
 * and optional totals, and the rows beneath. Open by default when `open`.
 */
export function MonthGroup({
  title,
  summary,
  aside,
  open = false,
  children,
}: {
  title: string;
  summary?: ReactNode;
  aside?: ReactNode;
  open?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={open} className="group overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 transition hover:bg-surface-2/60 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-2 text-faint transition group-open:rotate-90"
          >
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none">
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0">
            <div className="font-display text-base font-semibold tracking-tight text-foreground">{title}</div>
            {summary && <div className="mt-0.5 truncate text-xs text-faint">{summary}</div>}
          </div>
        </div>
        {aside && <div className="flex shrink-0 items-center gap-4">{aside}</div>}
      </summary>
      <div className="border-t border-border">{children}</div>
    </details>
  );
}
