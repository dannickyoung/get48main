import { addMonths } from "date-fns";
import { parseDateOnly } from "@/lib/retainer/engine";
import { monthLabel, money } from "@/lib/format";
import { NumberField } from "@/components/ui/NumberField";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Pill } from "@/components/ui/StatusPill";
import { setMonthTerms } from "@/app/actions";
import type { Retainer, RetainerMonth } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";

export function MonthlyTermsCard({
  retainer,
  months,
  currentIndex,
}: {
  retainer: Retainer;
  months: RetainerMonth[];
  currentIndex: number;
}) {
  const start = parseDateOnly(retainer.start_date);
  const overrides = new Map(months.map((m) => [m.period_index, m]));

  // Every month from the start through next month (so you can plan ahead).
  const rows = [];
  for (let k = Math.max(0, currentIndex + 1); k >= 0; k--) {
    const o = overrides.get(k);
    rows.push({
      k,
      label: monthLabel(addMonths(start, k)),
      videos: o?.videos_per_month ?? null,
      price: o?.monthly_price != null ? Number(o.monthly_price) : null,
    });
  }

  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">Monthly terms</h2>
        <span className="text-xs text-faint tnum">
          default {retainer.videos_per_month}/mo · {money(retainer.monthly_price)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">Override videos or price for a specific month. Blank = retainer default.</p>

      <ul className="mt-4 divide-y divide-border">
        {rows.map((r) => {
          const overridden = r.videos != null || r.price != null;
          return (
            <li key={r.k}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground tnum">{r.label}</span>
                    {r.k === currentIndex && <Pill tone="good">Current</Pill>}
                    {r.k === currentIndex + 1 && <Pill tone="muted">Next</Pill>}
                    {overridden && <Pill tone="warn">Custom</Pill>}
                  </div>
                  <div className="flex items-center gap-4 text-sm tnum">
                    <span className={r.videos != null ? "font-semibold text-accent" : "text-muted"}>
                      {r.videos ?? retainer.videos_per_month} vids
                    </span>
                    <span className={r.price != null ? "font-semibold text-accent" : "text-muted"}>
                      {money(r.price ?? retainer.monthly_price)}
                    </span>
                    <span className="text-xs text-faint group-open:text-accent">Edit</span>
                  </div>
                </summary>
                <ActionForm
                  action={setMonthTerms.bind(null, retainer.client_id, r.k)}
                  success={`${r.label} terms updated`}
                  className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-[1fr_1fr_auto]"
                >
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Videos / month</span>
                    <div className="mt-1.5">
                      <NumberField
                        name="videos_per_month"
                        min={0}
                        defaultValue={r.videos ?? undefined}
                        placeholder={`${retainer.videos_per_month} (default)`}
                        className={inputCls}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Monthly price</span>
                    <div className="mt-1.5">
                      <NumberField
                        name="monthly_price"
                        min={0}
                        step={50}
                        defaultValue={r.price ?? undefined}
                        placeholder={`${retainer.monthly_price} (default)`}
                        className={inputCls}
                      />
                    </div>
                  </label>
                  <div className="col-span-2 flex items-end sm:col-span-1">
                    <SubmitButton
                      pendingLabel="Saving"
                      className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover sm:w-auto"
                    >
                      Save month
                    </SubmitButton>
                  </div>
                </ActionForm>
              </details>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
