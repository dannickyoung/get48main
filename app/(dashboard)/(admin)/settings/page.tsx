import { requireAdmin } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";
import { Section } from "@/components/ui/Section";

export default async function SettingsPage() {
  const profile = await requireAdmin();

  return (
    <div className="rise max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1.5 text-[15px] text-muted">Your account and the studio&apos;s rollover policy.</p>
      </div>

      <Section title="Account">
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Email</dt>
            <dd className="mt-1 text-sm text-foreground">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wider text-faint">Role</dt>
            <dd className="mt-1 text-sm text-foreground">Studio admin</dd>
          </div>
        </dl>
      </Section>

      <Section title="Change password" description="Update the password you use to sign in.">
        <ChangePasswordForm />
      </Section>

      <Section
        title="Rollover policy"
        description="These are the defaults; each client's cap and window can be tuned on their retainer terms."
      >
        <ul className="space-y-2.5 text-sm leading-relaxed text-muted">
          <li className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            Up to <span className="font-semibold text-foreground">5</span> unused videos roll over into the following
            month.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            Rolled-over videos expire <span className="font-semibold text-foreground">8 weeks</span> after the end of
            the month they accrued — no refund or credit after.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            No more than <span className="font-semibold text-foreground">5</span> rolled-over videos may be held at
            once; the surplus is forfeited at month-end.
          </li>
        </ul>
      </Section>
    </div>
  );
}
