import Link from "next/link";

export type AttentionItem = {
  href: string;
  primary: string;
  secondary: string;
  value: string;
  tone?: "good" | "warn" | "bad" | "muted";
};

const VALUE_TONE: Record<string, string> = {
  good: "text-accent",
  warn: "text-warn",
  bad: "text-bad",
  muted: "text-muted",
};

export function AttentionCard({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: AttentionItem[];
  emptyText: string;
}) {
  return (
    <section className="rounded-2xl bg-surface p-5 ring-1 ring-border">
      <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-faint">{title}</h2>
      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3.5 py-3 text-sm text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {emptyText}
        </div>
      ) : (
        <ul className="mt-3 space-y-1">
          {items.map((it, i) => (
            <li key={i}>
              <Link
                href={it.href}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition hover:bg-surface-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{it.primary}</div>
                  <div className="truncate text-xs text-faint">{it.secondary}</div>
                </div>
                <div className={`shrink-0 font-display text-sm font-semibold tnum ${VALUE_TONE[it.tone ?? "muted"]}`}>
                  {it.value}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
