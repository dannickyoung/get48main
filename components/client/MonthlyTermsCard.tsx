import { addMonths } from "date-fns";
import { parseDateOnly } from "@/lib/retainer/engine";
import { ADDITIONAL_VIDEO_COST_MAX, ADDITIONAL_VIDEO_COST_MIN, additionalVideosCharge } from "@/lib/retainer/additional";
import { monthLabel, money } from "@/lib/format";
import { NumberField } from "@/components/ui/NumberField";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Pill } from "@/components/ui/StatusPill";
import { Section } from "@/components/ui/Section";
import { setMonthTerms } from "@/app/actions";
import type { Retainer, RetainerMonth } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";
const labelCls = "text-[11px] font-semibold uppercase tracking-wider text-faint";

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
    const additional = Math.max(0, Number(o?.additional_videos ?? 0));
    const additionalCost = Number(o?.additional_video_cost ?? 0);
    rows.push({
      k,
      label: monthLabel(addMonths(start, k)),
      videos: o?.videos_per_month ?? null,
      price: o?.monthly_price != null ? Number(o.monthly_price) : null,
      overageRate: o?.overage_rate != null ? Number(o.overage_rate) : null,
      additional,
      additionalCost,
      additionalCharge: additionalVideosCharge(additional, additionalCost),
    });
  }

  return (
    <Section
      title="Monthly terms"
      description="Override the set number of videos or price for a specific month (blank = retainer default), or add extra videos to a month at a per-video cost."
      aside={
        <span className="text-xs text-faint tnum">
          default {retainer.videos_per_month}/mo · {money(retainer.monthly_price)}
        </span>
      }
    >
      <ul className="divide-y divide-border">
        {rows.map((r) => {
          const setVideos = r.videos ?? retainer.videos_per_month;
          const overridden = r.videos != null || r.price != null || r.overageRate != null;
          const hasAdditional = r.additional > 0;
          return (
            <li key={r.k}>
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground tnum">{r.label}</span>
                    {r.k === currentIndex && <Pill tone="good">Current</Pill>}
                    {r.k === currentIndex + 1 && <Pill tone="muted">Next</Pill>}
                    {overridden && <Pill tone="warn">Custom</Pill>}
                    {hasAdditional && (
                      <Pill tone="good">
                        +{r.additional} additional
                      </Pill>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm tnum">
                    <span className={r.videos != null || hasAdditional ? "font-semibold text-accent" : "text-muted"}>
                      {setVideos + r.additional} vids
                      {hasAdditional && (
                        <span className="font-normal text-faint">
                          {" "}
                          ({setVideos}+{r.additional})
                        </span>
                      )}
                    </span>
                    <span className={r.price != null || hasAdditional ? "font-semibold text-accent" : "text-muted"}>
                      {money((r.price ?? Number(retainer.monthly_price)) + r.additionalCharge)}
                    </span>
                    <span className="text-xs text-faint group-open:text-accent">
                      <span className="group-open:hidden">Edit</span>
                      <span className="hidden group-open:inline">Close</span>
                    </span>
                  </div>
                </summary>
                <ActionForm
                  action={setMonthTerms.bind(null, retainer.client_id, r.k)}
                  success={`${r.label} terms updated`}
                  className="space-y-4 pb-4"
                >
                  {/* Set number of videos + price for the month */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <label className="block">
                      <span className={labelCls}>Videos / month</span>
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
                      <span className={labelCls}>Monthly price</span>
                      <div className="mt-1.5">
                        <NumberField
                          name="monthly_price"
                          min={0}
                          defaultValue={r.price ?? undefined}
                          placeholder={`${retainer.monthly_price} (default)`}
                          className={inputCls}
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className={labelCls}>Overage rate</span>
                      <div className="mt-1.5">
                        <NumberField
                          name="overage_rate"
                          min={0}
                          defaultValue={r.overageRate ?? undefined}
                          placeholder={`${retainer.overage_rate} (default)`}
                          className={inputCls}
                        />
                      </div>
                    </label>
                  </div>

                  {/* Additional videos: quantity + cost per video (0–1000) */}
                  <div className="rounded-xl bg-surface-2 p-3.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div className="text-sm font-semibold text-foreground">Additional videos</div>
                      <div className="text-xs text-faint tnum">
                        {hasAdditional
                          ? `${r.additional} × ${money(r.additionalCost)} = ${money(r.additionalCharge)} · billed at month-end`
                          : "Adds to this month's allotment · billed quantity × cost at month-end"}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                      <label className="block">
                        <span className={labelCls}>Quantity</span>
                        <div className="mt-1.5">
                          <NumberField
                            name="additional_videos"
                            min={0}
                            step={1}
                            defaultValue={hasAdditional ? r.additional : undefined}
                            placeholder="0"
                            className={inputCls}
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className={labelCls}>Cost / video ({money(ADDITIONAL_VIDEO_COST_MIN)}–{money(ADDITIONAL_VIDEO_COST_MAX)})</span>
                        <div className="mt-1.5">
                          <NumberField
                            name="additional_video_cost"
                            min={ADDITIONAL_VIDEO_COST_MIN}
                            max={ADDITIONAL_VIDEO_COST_MAX}
                            step={1}
                            defaultValue={hasAdditional || r.additionalCost > 0 ? r.additionalCost : undefined}
                            placeholder="0"
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
                    </div>
                  </div>
                </ActionForm>
              </details>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
