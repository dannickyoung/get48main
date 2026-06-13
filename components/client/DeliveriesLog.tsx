import { logDelivery, updateDelivery } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { DeleteDeliveryButton } from "@/components/client/DeleteDeliveryButton";
import { VideoStatusBadge } from "@/components/ui/VideoStatusBadge";
import { Section } from "@/components/ui/Section";
import { shortDate } from "@/lib/format";
import { todaySGTString } from "@/lib/time";
import { VIDEO_STATUSES } from "@/lib/video-status";
import type { VideoRow } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";

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
  const total = videos.reduce((s, v) => s + v.quantity, 0);

  return (
    <Section
      title={hideTitle ? undefined : "Delivered videos"}
      aside={hideTitle ? undefined : <span className="text-sm text-faint tnum">{total} total</span>}
    >
      {!readOnly && (
        <ActionForm
          action={logDelivery.bind(null, clientId)}
          success="Delivery logged"
          className="grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 sm:grid-cols-[150px_1fr_96px_150px_auto]"
        >
          <DateField name="delivered_on" defaultValue={today} required className={inputCls} />
          <input type="text" name="title" placeholder="Title / concept (optional)" className={inputCls} />
          <NumberField name="quantity" min={1} defaultValue={1} className={inputCls} aria-label="Quantity" />
          <select name="status" defaultValue="completed" aria-label="Status" className={`field-select ${inputCls}`}>
            {VIDEO_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <SubmitButton className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover">
            Log
          </SubmitButton>
        </ActionForm>
      )}

      <ul className={`${readOnly ? "" : "mt-5"} divide-y divide-border`}>
        {videos.length === 0 && (
          <li className="py-8 text-center text-sm text-faint">
            No videos logged yet{readOnly ? "." : " — add the first delivery above."}
          </li>
        )}
        {videos.map((v) => (
          <li key={v.id}>
            {readOnly ? (
              <div className="flex items-center gap-4 py-3">
                <Row v={v} />
              </div>
            ) : (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center gap-4 py-3">
                  <Row v={v} editable />
                </summary>
                <div className="pb-4">
                  <ActionForm
                    action={updateDelivery.bind(null, v.id, clientId)}
                    success="Delivery updated"
                    className="grid grid-cols-2 gap-3 sm:grid-cols-[150px_1fr_96px_150px]"
                  >
                    <DateField name="delivered_on" defaultValue={v.delivered_on} className={inputCls} />
                    <input type="text" name="title" defaultValue={v.title ?? ""} placeholder="Title / concept" className={inputCls} />
                    <NumberField name="quantity" min={1} defaultValue={v.quantity} className={inputCls} aria-label="Quantity" />
                    <select name="status" defaultValue={v.status} aria-label="Status" className={`field-select ${inputCls}`}>
                      {VIDEO_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
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
    </Section>
  );
}

function Row({ v, editable = false }: { v: VideoRow; editable?: boolean }) {
  return (
    <>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 font-display text-sm font-semibold tnum text-accent" title={`${v.quantity} video${v.quantity === 1 ? "" : "s"}`}>
        ×{v.quantity}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{v.title || "Untitled delivery"}</div>
        <div className="text-xs text-faint tnum">{shortDate(v.delivered_on)}</div>
      </div>
      <VideoStatusBadge status={v.status} />
      {v.link && (
        <a href={v.link} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent hover:text-accent-hover" onClick={(e) => e.stopPropagation()}>
          View
        </a>
      )}
      {editable && (
        <span className="text-xs font-medium text-faint transition group-open:text-accent">
          <span className="group-open:hidden">Edit</span>
          <span className="hidden group-open:inline">Close</span>
        </span>
      )}
    </>
  );
}
