import { InfoCircle } from "iconoir-react";

/** Small info icon with a hover/focus tooltip. */
export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="grid place-items-center text-faint transition hover:text-muted focus-visible:text-muted"
      >
        <InfoCircle width={14} height={14} strokeWidth={1.6} />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-[230px] -translate-x-1/2 rounded-lg bg-surface-3 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-foreground opacity-0 shadow-lg ring-1 ring-border-strong transition-opacity duration-150 group-hover/tip:opacity-100 group-focus-within/tip:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
