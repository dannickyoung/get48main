import Link from "next/link";
import { addClient } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";

const inputCls =
  "w-full rounded-lg bg-background px-3.5 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export default function NewClientPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="rise mx-auto max-w-2xl space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1.5 text-sm font-medium text-faint transition hover:text-foreground">
        <span aria-hidden>←</span> All clients
      </Link>

      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Add a client</h1>
        <p className="mt-1.5 text-[15px] text-muted">
          Set up the client and their retainer terms. They&apos;ll get a view-only login at the email below.
        </p>
      </div>

      <form action={addClient} className="space-y-6">
        <div>
          <h2 className="mb-3 px-1 font-display text-sm font-semibold uppercase tracking-wider text-faint">Client</h2>
          <div className="grid grid-cols-1 gap-4 rounded-2xl bg-surface p-6 ring-1 ring-border sm:grid-cols-2">
            <label className="block">
              <span className={labelCls}>Name *</span>
              <input name="name" required placeholder="Acme Studios" className={`mt-1.5 ${inputCls}`} />
            </label>
            <label className="block">
              <span className={labelCls}>Login email *</span>
              <input name="email" type="email" required placeholder="team@acme.com" className={`mt-1.5 ${inputCls}`} />
            </label>
            <label className="block">
              <span className={labelCls}>Company</span>
              <input name="company" placeholder="Optional" className={`mt-1.5 ${inputCls}`} />
            </label>
            <label className="block">
              <span className={labelCls}>Notes</span>
              <input name="notes" placeholder="Optional" className={`mt-1.5 ${inputCls}`} />
            </label>
          </div>
        </div>

        <div>
          <h2 className="mb-3 px-1 font-display text-sm font-semibold uppercase tracking-wider text-faint">Retainer terms</h2>
          <div className="rounded-2xl bg-surface p-6 ring-1 ring-border">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className={labelCls}>Start date *</span>
              <div className="mt-1.5">
                <DateField name="start_date" required defaultValue={today} className={inputCls} />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Videos / month *</span>
              <div className="mt-1.5">
                <NumberField name="videos_per_month" min={1} required defaultValue={4} className={inputCls} />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Monthly price</span>
              <div className="mt-1.5">
                <NumberField name="monthly_price" min={0} step={50} defaultValue={0} className={inputCls} />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Overage / video</span>
              <div className="mt-1.5">
                <NumberField name="overage_rate" min={0} step={25} defaultValue={0} className={inputCls} />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Rollover cap</span>
              <div className="mt-1.5">
                <NumberField name="rollover_cap" min={0} defaultValue={5} className={inputCls} />
              </div>
            </label>
            <label className="block">
              <span className={labelCls}>Rollover weeks</span>
              <div className="mt-1.5">
                <NumberField name="rollover_weeks" min={1} defaultValue={8} className={inputCls} />
              </div>
            </label>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            Defaults follow the standard agreement: up to 5 unused videos roll over, expiring 8 weeks after
            the month they accrued, with no more than 5 held at once.
          </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard" className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-border transition hover:text-foreground">
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Create client
          </button>
        </div>
      </form>
    </div>
  );
}
