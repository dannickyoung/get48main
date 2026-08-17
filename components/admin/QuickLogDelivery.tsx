import { logDeliveryQuick } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { SelectField } from "@/components/ui/SelectField";
import { todaySGTString } from "@/lib/time";
import { VIDEO_STATUSES } from "@/lib/video-status";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-faint";

/** Compact cross-client "log a delivery" panel, collapsible so the board stays in view. */
export function QuickLogDelivery({ clients }: { clients: { id: string; name: string }[] }) {
  const today = todaySGTString();
  return (
    <details open className="group rounded-2xl bg-surface ring-1 ring-border">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 sm:px-6">
        <div>
          <div className="font-display text-base font-semibold tracking-tight">Log a delivery</div>
          <div className="mt-0.5 text-xs text-faint">Pick the client, date it, and it lands in that client&apos;s month instantly.</div>
        </div>
        <span className="text-xs text-faint group-open:text-accent">
          <span className="group-open:hidden">Show</span>
          <span className="hidden group-open:inline">Hide</span>
        </span>
      </summary>
      <ActionForm
        action={logDeliveryQuick}
        success="Delivery logged"
        className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4 sm:grid-cols-[1.2fr_150px_1.6fr_96px_150px_auto] sm:px-6"
      >
        <label className="block">
          <span className={labelCls}>Client</span>
          <div className="mt-1.5">
            <SelectField name="client_id" required defaultValue="" className={inputCls}>
              <option value="" disabled>
                Choose client…
              </option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          </div>
        </label>
        <label className="block">
          <span className={labelCls}>Delivered on</span>
          <div className="mt-1.5">
            <DateField name="delivered_on" defaultValue={today} required className={inputCls} />
          </div>
        </label>
        <label className="block col-span-2 sm:col-span-1">
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
          <SubmitButton
            pendingLabel="Logging"
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover sm:w-auto"
          >
            Log delivery
          </SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}
