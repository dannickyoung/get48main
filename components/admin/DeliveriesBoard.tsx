import Link from "next/link";
import { format } from "date-fns";
import { MonthGroup } from "@/components/admin/MonthGroup";
import { DeliveryStatusSelect } from "@/components/admin/DeliveryStatusSelect";
import { VideoStatusBadge } from "@/components/ui/VideoStatusBadge";
import { parseDateOnly } from "@/lib/retainer/engine";
import { shortDate } from "@/lib/format";
import type { DeliveryWithClient } from "@/lib/aggregate";

/** Calendar-month key of a delivery (yyyy-MM). */
export const deliveryMonthKey = (d: DeliveryWithClient) => d.delivered_on.slice(0, 7);
const DONE = new Set(["final", "completed"]);

/**
 * Deliveries grouped by calendar month, newest first. Each month is a
 * collapsible card with a production summary; the current month starts open.
 */
export function DeliveriesBoard({
  deliveries,
  openKeys,
  readOnly = false,
}: {
  deliveries: DeliveryWithClient[];
  openKeys: Set<string>;
  /** Client view: static status badges, no client name, no edit link. */
  readOnly?: boolean;
}) {
  const groups = new Map<string, DeliveryWithClient[]>();
  for (const d of deliveries) {
    const k = deliveryMonthKey(d);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(d);
  }
  const keys = [...groups.keys()].sort((a, b) => (a < b ? 1 : -1));

  if (keys.length === 0) {
    return (
      <div className="rounded-2xl bg-surface p-10 text-center ring-1 ring-border">
        <p className="text-sm text-faint">Nothing matches these filters.</p>
      </div>
    );
  }

  return (
    <div className="stagger space-y-3">
      {keys.map((k) => {
        const list = groups.get(k)!.sort((a, b) => (a.delivered_on < b.delivered_on ? 1 : -1));
        const videos = list.reduce((s, d) => s + d.quantity, 0);
        const done = list.filter((d) => DONE.has(d.status)).reduce((s, d) => s + d.quantity, 0);
        const inProd = videos - done;
        const clients = new Set(list.map((d) => d.client_id)).size;
        return (
          <MonthGroup
            key={k}
            title={format(parseDateOnly(`${k}-01`), "MMMM yyyy")}
            open={openKeys.has(k)}
            summary={`${videos} ${videos === 1 ? "video" : "videos"} · ${list.length} ${list.length === 1 ? "delivery" : "deliveries"}${readOnly ? "" : ` · ${clients} ${clients === 1 ? "client" : "clients"}`}`}
            aside={
              <>
                {inProd > 0 && (
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-faint">In production</div>
                    <div className="font-display text-sm font-semibold tnum text-warn">{inProd}</div>
                  </div>
                )}
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-faint">Completed</div>
                  <div className="font-display text-sm font-semibold tnum text-accent">{done}</div>
                </div>
              </>
            }
          >
            <ul className="divide-y divide-border">
              {list.map((d) => (
                <li
                  key={d.id}
                  className="grid grid-cols-[36px_1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[36px_minmax(0,1.7fr)_minmax(0,1fr)_104px_64px] sm:px-6"
                >
                  <div
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold tnum text-accent"
                    title={`${d.quantity} video${d.quantity === 1 ? "" : "s"}`}
                  >
                    ×{d.quantity}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{d.title || "Untitled delivery"}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                      {readOnly ? (
                        <span className="tnum sm:hidden">{shortDate(d.delivered_on)}</span>
                      ) : (
                        <Link href={`/clients/${d.client_id}`} className="hover:text-accent">
                          {d.clientName}
                        </Link>
                      )}
                      {d.link && (
                        <>
                          {(!readOnly || true) && <span className={readOnly ? "sm:hidden" : ""}>·</span>}
                          <a href={d.link} target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-hover">
                            View
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="col-span-3 flex items-center justify-between gap-3 sm:col-span-1 sm:justify-start">
                    {readOnly ? <VideoStatusBadge status={d.status} /> : <DeliveryStatusSelect videoId={d.id} clientId={d.client_id} status={d.status} />}
                  </div>
                  <div className="hidden text-right text-xs text-faint tnum sm:block">{shortDate(d.delivered_on)}</div>
                  <div className="hidden justify-end sm:flex">
                    {!readOnly && (
                      <Link
                        href={`/clients/${d.client_id}#deliveries`}
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-faint transition hover:bg-surface-2 hover:text-foreground"
                      >
                        Edit
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </MonthGroup>
        );
      })}
    </div>
  );
}
