import { format } from "date-fns";
import { logDelivery, updateDelivery } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { SelectField } from "@/components/ui/SelectField";
import { DeleteDeliveryButton } from "@/components/client/DeleteDeliveryButton";
import { VideoStatusBadge } from "@/components/ui/VideoStatusBadge";
import { DeliveryStatusSelect } from "@/components/admin/DeliveryStatusSelect";
import { MonthGroup } from "@/components/admin/MonthGroup";
import { parseDateOnly } from "@/lib/retainer/engine";
import { shortDate } from "@/lib/format";
import { todaySGTString } from "@/lib/time";
import { VIDEO_STATUSES } from "@/lib/video-status";
import type { VideoRow } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-faint";
const DONE = new Set(["final", "completed"]);

/**
 * A client's delivered videos, grouped by calendar month (newest first).
 * The current month starts open; older months collapse to a summary line.
 * Admins get a log form on top, an inline status changer per row, and an
 * expandable editor per row.
 */
export function DeliveriesLog({
  clientId,
  videos,
  readOnly,
  hideTitle = false,
}: {
  clientId: string;
  videos: VideoRow[];
  readOnly: boolean;
  hideTitle?: boolean;
}) {
  const today = todaySGTString();
  const thisMonth = today.slice(0, 7);
  const total = videos.reduce((s, v) => s + v.quantity, 0);
  const inProd = videos.filter((v) => !DONE.has(v.status)).reduce((s, v) => s + v.quantity, 0);

  const groups = new Map<string, VideoRow[]>();
  for (const v of videos) {
    const k = v.delivered_on.slice(0, 7);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(v);
  }
  const keys = [...groups.keys()].sort((a, b) => (a < b ? 1 : -1));

  return (
    <section className="flex flex-col gap-3">
      {!hideTitle && (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
          <h2 className="font-display text-lg font-semibold tracking-tight">Delivered videos</h2>
          <span className="text-sm text-faint tnum">
            {total} total{inProd > 0 ? ` · ${inProd} in production` : ""}
          </span>
        </div>
      )}

      {!readOnly && (
        <ActionForm
          action={logDelivery.bind(null, clientId)}
          success="Delivery logged"
          className="grid grid-cols-2 gap-3 rounded-2xl bg-surface p-4 ring-1 ring-border sm:grid-cols-[150px_1fr_96px_150px_auto] sm:p-5"
        >
          <label className="block">
            <span className={labelCls}>Delivered on</span>
            <div className="mt-1.5">
              <DateField name="delivered_on" defaultValue={today} required className={inputCls} />
            </div>
          </label>
          <label className="col-span-2 block sm:col-span-1">
            <span className={labelCls}>Title / concept</span>
            <input type="text" name="title" placeholder="Optional" className={`mt-1.5 ${inputCls}`} />
          </label>
          <label className="block">
            <span className={labelCls}>Qty</span>
            <div className="mt-1.5">
              <NumberField name="quantity" min={1} defaultValue={1} className={inputCls} aria-label="Quantity" />
            </div>
          </label>
          <label className="block">
            <span className={labelCls}>Status</span>
            <div className="mt-1.5">
              <SelectField name="status" defaultValue="completed" aria-label="Status" className={inputCls}>
                {VIDEO_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </SelectField>
            </div>
          </label>
          <div className="col-span-2 flex items-end sm:col-span-1">
            <SubmitButton className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover sm:w-auto">
              Log
            </SubmitButton>
          </div>
        </ActionForm>
      )}

      {keys.length === 0 ? (
        <div className="rounded-2xl bg-surface p-8 text-center ring-1 ring-border">
          <p className="text-sm text-faint">No videos logged yet{readOnly ? "." : " — add the first delivery above."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k, i) => {
            const list = groups.get(k)!.sort((a, b) => (a.delivered_on < b.delivered_on ? 1 : -1));
            const n = list.reduce((s, v) => s + v.quantity, 0);
            const done = list.filter((v) => DONE.has(v.status)).reduce((s, v) => s + v.quantity, 0);
            return (
              <MonthGroup
                key={k}
                title={format(parseDateOnly(`${k}-01`), "MMMM yyyy")}
                summary={`${n} ${n === 1 ? "video" : "videos"} · ${list.length} ${list.length === 1 ? "delivery" : "deliveries"}`}
                open={k === thisMonth || i === 0}
                aside={
                  <>
                    {n - done > 0 && (
                      <div className="text-right">
                        <div className="text-[11px] uppercase tracking-wider text-faint">In production</div>
                        <div className="font-display text-sm font-semibold tnum text-warn">{n - done}</div>
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
                  {list.map((v) => (
                    <li key={v.id}>
                      {readOnly ? (
                        <div className="px-5 py-3 sm:px-6">
                          <Row v={v} />
                        </div>
                      ) : (
                        <details className="group/row">
                          <summary className="cursor-pointer list-none px-5 py-3 transition hover:bg-surface-2/60 sm:px-6">
                            <Row v={v} clientId={clientId} editable />
                          </summary>
                          <div className="border-t border-border bg-surface-2/40 px-5 py-4 sm:px-6">
                            <ActionForm
                              action={updateDelivery.bind(null, v.id, clientId)}
                              success="Delivery updated"
                              className="grid grid-cols-2 gap-3 sm:grid-cols-[150px_1fr_96px_150px]"
                            >
                              <DateField name="delivered_on" defaultValue={v.delivered_on} className={inputCls} />
                              <input type="text" name="title" defaultValue={v.title ?? ""} placeholder="Title / concept" className={inputCls} />
                              <NumberField name="quantity" min={1} defaultValue={v.quantity} className={inputCls} aria-label="Quantity" />
                              <SelectField key={v.status} name="status" defaultValue={v.status} aria-label="Status" className={inputCls}>
                                {VIDEO_STATUSES.map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </SelectField>
                              <input type="url" name="link" defaultValue={v.link ?? ""} placeholder="Link (optional)" className={`${inputCls} sm:col-span-4`} />
                              <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-4">
                                <DeleteDeliveryButton videoId={v.id} clientId={clientId} />
                                <SubmitButton
                                  pendingLabel="Saving"
                                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
                                >
                                  Save changes
                                </SubmitButton>
                              </div>
                            </ActionForm>
                          </div>
                        </details>
                      )}
                    </li>
                  ))}
                </ul>
              </MonthGroup>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Row({ v, clientId, editable = false }: { v: VideoRow; clientId?: string; editable?: boolean }) {
  return (
    <div className="grid grid-cols-[36px_1fr_auto] items-center gap-x-4 sm:grid-cols-[36px_minmax(0,1fr)_auto_104px_48px]">
      <div
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold tnum text-accent"
        title={`${v.quantity} video${v.quantity === 1 ? "" : "s"}`}
      >
        ×{v.quantity}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-foreground">{v.title || "Untitled delivery"}</div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-faint tnum">
          <span className="sm:hidden">{shortDate(v.delivered_on)}</span>
          {v.link && (
            <>
              <span className="sm:hidden">·</span>
              <a href={v.link} target="_blank" rel="noreferrer" className="font-medium text-accent hover:text-accent-hover">
                View
              </a>
            </>
          )}
        </div>
      </div>
      <div className="flex justify-end sm:justify-start">
        {editable && clientId ? <DeliveryStatusSelect videoId={v.id} clientId={clientId} status={v.status} /> : <VideoStatusBadge status={v.status} />}
      </div>
      <div className="hidden text-right text-xs text-faint tnum sm:block">{shortDate(v.delivered_on)}</div>
      <div className="hidden justify-end sm:flex">
        {editable && (
          <span className="text-xs font-medium text-faint transition group-open/row:text-accent">
            <span className="group-open/row:hidden">Edit</span>
            <span className="hidden group-open/row:inline">Close</span>
          </span>
        )}
      </div>
    </div>
  );
}
