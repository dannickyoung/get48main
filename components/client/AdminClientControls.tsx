import { updateClient, pauseRetainer, stopRetainer, resumeRetainer } from "@/app/actions";
import { DeleteClientButton } from "@/components/client/DeleteClientButton";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { Client } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export function AdminClientControls({ client }: { client: Client }) {
  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <h2 className="font-display text-lg font-semibold tracking-tight">Client details</h2>

      <ActionForm
        action={updateClient.bind(null, client.id)}
        success="Client details updated"
        className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2"
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

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-2">
          {client.archived ? (
            <ActionForm action={resumeRetainer.bind(null, client.id)} success="Retainer reactivated, client emailed">
              <SubmitButton
                pendingLabel="Reactivating"
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
              >
                Reactivate retainer
              </SubmitButton>
            </ActionForm>
          ) : (
            <>
              <ActionForm action={pauseRetainer.bind(null, client.id)} success="Retainer paused, client emailed">
                <SubmitButton
                  pendingLabel="Pausing"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-warn ring-1 ring-border transition hover:ring-border-strong"
                >
                  Pause retainer
                </SubmitButton>
              </ActionForm>
              <ActionForm action={stopRetainer.bind(null, client.id)} success="Retainer stopped, client emailed">
                <SubmitButton
                  pendingLabel="Stopping"
                  className="rounded-lg px-4 py-2.5 text-sm font-medium text-bad ring-1 ring-border transition hover:ring-border-strong"
                >
                  Stop retainer
                </SubmitButton>
              </ActionForm>
            </>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-md text-xs leading-relaxed text-faint">
            {client.archived
              ? "This client is archived. They can still sign in to view their account. Deleting removes their login for good."
              : "Pausing or stopping moves the client to Archived and emails them. They can still sign in. Deleting removes their login for good."}
          </p>
          <DeleteClientButton clientId={client.id} name={client.name} />
        </div>
      </div>
    </section>
  );
}
