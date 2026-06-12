import Link from "next/link";
import { logDeliveryQuick } from "@/app/actions";
import { shortDate } from "@/lib/format";
import type { DeliveryWithClient } from "@/lib/aggregate";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";

export function DeliveriesFeed({
  deliveries,
  clients,
}: {
  deliveries: DeliveryWithClient[];
  clients: { id: string; name: string }[];
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {clients.length > 0 && (
        <form
          action={logDeliveryQuick}
          className="grid grid-cols-2 gap-3 rounded-2xl bg-surface p-5 ring-1 ring-border sm:grid-cols-[1.2fr_auto_1.6fr_auto_auto] sm:p-6"
        >
          <select name="client_id" required defaultValue="" className={inputCls} aria-label="Client">
            <option value="" disabled>
              Choose client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="date" name="delivered_on" defaultValue={today} required className={inputCls} />
          <input type="text" name="title" placeholder="Title / concept (optional)" className={inputCls} />
          <input type="number" name="quantity" min={1} defaultValue={1} className={`${inputCls} w-20`} aria-label="Quantity" />
          <button type="submit" className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover">
            Log delivery
          </button>
        </form>
      )}

      <section className="rounded-2xl bg-surface p-5 ring-1 ring-border sm:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-faint">Recent deliveries</h2>
          <span className="text-sm text-faint tnum">{deliveries.reduce((s, d) => s + d.quantity, 0)} total</span>
        </div>
        <ul className="divide-y divide-border">
          {deliveries.slice(0, 40).map((d) => (
            <li key={d.id} className="flex items-center gap-4 py-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold tnum text-accent">
                {d.quantity}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{d.title || "Untitled delivery"}</div>
                <Link href={`/clients/${d.client_id}`} className="text-xs text-faint hover:text-accent">
                  {d.clientName}
                </Link>
              </div>
              <div className="text-xs text-faint tnum">{shortDate(d.delivered_on)}</div>
              {d.link && (
                <a href={d.link} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-hover">
                  View
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
