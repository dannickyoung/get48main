import { updateRetainer } from "@/app/actions";
import { DateField } from "@/components/ui/DateField";
import { NumberField } from "@/components/ui/NumberField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { Section } from "@/components/ui/Section";
import { money, shortDate } from "@/lib/format";
import type { Retainer } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export function RetainerTermsCard({
  retainer,
  readOnly,
  cycleStart,
  cycleEnd,
}: {
  retainer: Retainer;
  readOnly: boolean;
  cycleStart?: Date;
  cycleEnd?: Date;
}) {
  return (
    <Section title="Retainer terms">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
        <Term label="Retainer start" value={shortDate(retainer.start_date)} />
        {cycleStart && cycleEnd ? (
          <Term label="Current cycle" value={`${shortDate(cycleStart)} – ${shortDate(cycleEnd)}`} />
        ) : (
          <Term label="Status" value={retainer.status} />
        )}
        <Term label="Videos / month" value={retainer.videos_per_month} />
        <Term label="Monthly price" value={money(retainer.monthly_price)} />
        <Term label="Overage rate" value={retainer.overage_rate ? `${money(retainer.overage_rate)} / video` : "—"} />
        <Term label="Rollover cap" value={`${retainer.rollover_cap} videos`} />
        <Term label="Rollover window" value={`${retainer.rollover_weeks} weeks`} />
      </dl>

      {!readOnly && (
        <details className="group mt-6">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover">
            <span className="transition group-open:rotate-45">+</span> Edit terms
          </summary>
          <ActionForm
            action={updateRetainer.bind(null, retainer.client_id)}
            success="Retainer terms updated"
            className="mt-4 grid grid-cols-2 gap-4 rounded-xl bg-surface-2 p-4"
          >
            <Field label="Start date">
              <DateField name="start_date" defaultValue={retainer.start_date} className={inputCls} />
            </Field>
            <Field label="Videos / month">
              <NumberField name="videos_per_month" min={1} defaultValue={retainer.videos_per_month} className={inputCls} />
            </Field>
            <Field label="Monthly price">
              <NumberField name="monthly_price" min={0} defaultValue={retainer.monthly_price} className={inputCls} />
            </Field>
            <Field label="Overage rate / video">
              <NumberField name="overage_rate" min={0} defaultValue={retainer.overage_rate} className={inputCls} />
            </Field>
            <Field label="Rollover cap">
              <NumberField name="rollover_cap" min={0} defaultValue={retainer.rollover_cap} className={inputCls} />
            </Field>
            <Field label="Rollover weeks">
              <NumberField name="rollover_weeks" min={1} defaultValue={retainer.rollover_weeks} className={inputCls} />
            </Field>
            <div className="col-span-2 flex justify-end">
              <SubmitButton
                pendingLabel="Saving"
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
              >
                Save terms
              </SubmitButton>
            </div>
          </ActionForm>
        </details>
      )}
    </Section>
  );
}

function Term({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className={labelCls}>{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold tnum text-foreground">{value}</dd>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
