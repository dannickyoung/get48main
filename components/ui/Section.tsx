import type { ReactNode } from "react";

/**
 * A titled section. The heading and description sit OUTSIDE the card,
 * above it; the card holds only the content (no repeated inner title).
 * Pass `bare` when the child already provides its own card surface.
 */
export function Section({
  title,
  description,
  aside,
  bare = false,
  children,
}: {
  title?: string;
  description?: string;
  aside?: ReactNode;
  bare?: boolean;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || description || aside);
  return (
    <section className="space-y-3">
      {hasHeader && (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <div className="max-w-xl">
            {title && <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>}
            {description && <p className="mt-1 text-sm text-faint">{description}</p>}
          </div>
          {aside && <div className="shrink-0">{aside}</div>}
        </div>
      )}
      {bare ? children : <div className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">{children}</div>}
    </section>
  );
}
