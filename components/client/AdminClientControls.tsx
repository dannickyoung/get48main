import { updateClient, setArchived } from "@/app/actions";
import { DeleteClientButton } from "@/components/client/DeleteClientButton";
import type { Client } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export function AdminClientControls({ client }: { client: Client }) {
  return (
    <section className="rounded-2xl bg-surface p-6 ring-1 ring-border sm:p-7">
      <h2 className="font-display text-lg font-semibold tracking-tight">Client details</h2>

      <form
        action={updateClient.bind(null, client.id)}
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
          <button
            type="submit"
            className="rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-semibold text-foreground ring-1 ring-border transition hover:ring-border-strong"
          >
            Save details
          </button>
        </div>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <form action={setArchived.bind(null, client.id, !client.archived)}>
          <button
            type="submit"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-border transition hover:text-foreground hover:ring-border-strong"
          >
            {client.archived ? "Unarchive client" : "Archive client"}
          </button>
        </form>
        <DeleteClientButton clientId={client.id} name={client.name} />
      </div>
    </section>
  );
}
