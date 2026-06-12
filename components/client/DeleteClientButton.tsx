"use client";

import { useState, useTransition } from "react";
import { deleteClient } from "@/app/actions";

export function DeleteClientButton({ clientId, name }: { clientId: string; name: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        onClick={() => setArmed(true)}
        className="rounded-lg px-4 py-2.5 text-sm font-semibold text-bad ring-1 ring-border transition hover:ring-bad/60"
      >
        Delete client
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted">Delete {name} and all records?</span>
      <button
        disabled={pending}
        onClick={() => start(() => deleteClient(clientId))}
        className="rounded-lg bg-bad px-3.5 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-50"
        style={{ color: "var(--color-background)" }}
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button onClick={() => setArmed(false)} className="rounded-lg px-3 py-2 text-sm text-faint hover:text-foreground">
        Cancel
      </button>
    </div>
  );
}
