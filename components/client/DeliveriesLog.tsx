import { logDelivery, updateDelivery } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { DeleteDeliveryButton } from "@/components/client/DeleteDeliveryButton";
import { shortDate } from "@/lib/format";
import { todaySGTString } from "@/lib/time";
import type { VideoRow } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";

export function DeliveriesLog({
  clientId,
  videos,
  readOnly,
}: {
  clientId: string;
  videos: VideoRow[];
  readOnly: boolean;
}) {
  const today = todaySGTString();

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight">Delivered videos</h2>
        <span className="text-sm text-faint tnum">{videos.reduce((s, v) => s + v.quantity, 0)} total</span>
      </div>

      {!readOnly && (
        <ActionForm
          action={logDelivery.bind(null, clientId)}
          success="Delivery logged"
          className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-surface-2 p-4 sm:grid-cols-[150px_1fr_96px_auto]"
        >
          <DateField name="delivered_on" defaultValue={today} required className={inputCls} />
          <input type="text" name="title" placeholder="Title / concept (optional)" className={inputCls} />
          <NumberField name="quantity" min={1} defaultValue={1} className={inputCls} aria-label="Quantity" />
          <SubmitButton className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover">
            Log
          </SubmitButton>
        </ActionForm>
      )}

      <ul className="mt-5 divide-y divide-border">
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
                    className="grid grid-cols-2 gap-3 sm:grid-cols-[150px_1fr_96px]"
                  >
                    <DateField name="delivered_on" defaultValue={v.delivered_on} className={inputCls} />
                    <input type="text" name="title" defaultValue={v.title ?? ""} placeholder="Title / concept" className={inputCls} />
                    <NumberField name="quantity" min={1} defaultValue={v.quantity} className={inputCls} aria-label="Quantity" />
                    <input type="url" name="link" defaultValue={v.link ?? ""} placeholder="Link (optional)" className={`${inputCls} sm:col-span-3`} />
                    <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-3">
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
    </section>
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
