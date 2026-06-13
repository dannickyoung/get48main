import { updateClient, pauseRetainer, stopRetainer, resumeRetainer } from "@/app/actions";
import { DeleteClientButton } from "@/components/client/DeleteClientButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Section } from "@/components/ui/Section";
import type { Client } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export function AdminClientControls({ client }: { client: Client }) {
  return (
    <>
      <Section title="Client details">
        <ActionForm
          action={updateClient.bind(null, client.id)}
          success="Client details updated"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <label className="block">
            <span className={labelCls}>Name</span>
            <input name="name" defaultValue={client.name} required className={`mt-1.5 ${inputCls}`} />
          </label>
          <label className="block">
            <span className={labelCls}>Login email</span>
            <input name="email" type="email" defaultValue={client.email} required className={`mt-1.5 ${inputCls}`} />
          </label>
          <label className="block">
            <span className={labelCls}>Company</span>
            <input name="company" defaultValue={client.company ?? ""} className={`mt-1.5 ${inputCls}`} />
          </label>
          <label className="block">
            <span className={labelCls}>Notes</span>
            <input name="notes" defaultValue={client.notes ?? ""} className={`mt-1.5 ${inputCls}`} />
          </label>
          <div className="sm:col-span-2 flex justify-end">
            <SubmitButton
              pendingLabel="Saving"
              className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:ring-border-strong"
            >
              Save details
            </SubmitButton>
          </div>
        </ActionForm>
      </Section>

      <Section title="Manage retainer">
        <div className="divide-y divide-border">
          {client.archived ? (
            <Row title="Reactivate retainer" desc="Set the retainer active and move the client out of Archived. Emails them a welcome back.">
              <ActionForm action={resumeRetainer.bind(null, client.id)} success="Retainer reactivated, client emailed">
                <SubmitButton
                  pendingLabel="Reactivating"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
                >
                  Reactivate
                </SubmitButton>
              </ActionForm>
            </Row>
          ) : (
            <>
              <Row title="Pause retainer" desc="Pause billing and deliveries. Moves the client to Archived and emails them. They can still sign in.">
                <ActionForm action={pauseRetainer.bind(null, client.id)} success="Retainer paused, client emailed">
                  <SubmitButton
                    pendingLabel="Pausing"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-warn ring-1 ring-border transition hover:ring-border-strong"
                  >
                    Pause
                  </SubmitButton>
                </ActionForm>
              </Row>
              <Row title="Stop retainer" desc="End the retainer for good. Moves the client to Archived and emails them. They can still sign in.">
                <ActionForm action={stopRetainer.bind(null, client.id)} success="Retainer stopped, client emailed">
                  <SubmitButton
                    pendingLabel="Stopping"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-bad ring-1 ring-border transition hover:ring-border-strong"
                  >
                    Stop
                  </SubmitButton>
                </ActionForm>
              </Row>
            </>
          )}

          <Row title="Delete client" desc="Permanently delete the client and remove their login. This cannot be undone.">
            <DeleteClientButton clientId={client.id} name={client.name} />
          </Row>
        </div>
      </Section>
    </>
  );
}

function Row({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-xs leading-relaxed text-faint">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
