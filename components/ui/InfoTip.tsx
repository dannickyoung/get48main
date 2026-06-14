"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { InfoCircle } from "iconoir-react";

/**
 * Small info icon with a hover/focus tooltip. The bubble is portaled to
 * <body> with fixed positioning so it escapes every card's stacking context
 * and overflow clipping — it always renders on top.
 */
export function InfoTip({ text }: { text: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  function show() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.top - 8, left: r.left + r.width / 2 });
  }
  function hide() {
    setPos(null);
  }

  return (
    <span className="inline-flex align-middle">
      <button
        ref={ref}
        type="button"
        aria-label={text}
        className="grid place-items-center text-faint transition hover:text-muted focus-visible:text-muted"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <InfoCircle width={14} height={14} strokeWidth={1.6} />
      </button>
      {pos &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            role="tooltip"
            style={{ top: pos.top, left: pos.left }}
            className="pointer-events-none fixed z-[9999] w-max max-w-[230px] -translate-x-1/2 -translate-y-full rounded-lg bg-surface-3 px-2.5 py-1.5 text-left text-xs font-normal leading-snug text-foreground shadow-lg ring-1 ring-border-strong"
          >
            {text}
          </span>,
          document.body,
        )}
    </span>
  );
}
