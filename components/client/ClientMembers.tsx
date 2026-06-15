import { addClientMember, removeClientMember } from "@/app/actions";
import { ActionForm } from "@/components/ui/ActionForm";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Section } from "@/components/ui/Section";
import type { Client, ClientMember } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";

export function ClientMembers({ client, members }: { client: Client; members: ClientMember[] }) {
  return (
    <Section
      title="Team access"
      description="Everyone who can sign in and view this dashboard. Each signs in with their own email and a one-time code."
    >
      <ul className="divide-y divide-border">
        <li className="flex items-center justify-between gap-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-foreground">{client.email}</div>
            <div className="text-xs text-faint">Primary contact</div>
          </div>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-faint ring-1 ring-border">
            Primary
          </span>
        </li>

        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-foreground">{m.email}</div>
              <div className="text-xs text-faint">Team member</div>
            </div>
            <ActionForm action={removeClientMember.bind(null, m.id, client.id)} success="Access removed">
              <SubmitButton
                pendingLabel="Removing"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-bad ring-1 ring-border transition hover:ring-border-strong"
              >
                Remove
              </SubmitButton>
            </ActionForm>
          </li>
        ))}
      </ul>

      <ActionForm
        action={addClientMember.bind(null, client.id)}
        success="Access added — they've been emailed"
        className="mt-4 flex flex-col gap-3 sm:flex-row"
      >
        <input
          name="email"
          type="email"
          required
          placeholder="teammate@email.com"
          className={inputCls}
        />
        <SubmitButton
          pendingLabel="Adding"
          className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Add person
        </SubmitButton>
      </ActionForm>
    </Section>
  );
}
