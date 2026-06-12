"use client";

import { useTransition } from "react";
import { deleteDelivery } from "@/app/actions";
import { toast } from "@/lib/toast";

export function DeleteDeliveryButton({ videoId, clientId }: { videoId: string; clientId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          try {
            await deleteDelivery(videoId, clientId);
            toast.success("Delivery deleted");
          } catch {
            toast.error("Couldn't delete delivery");
          }
        })
      }
      className="rounded-lg px-3 py-2 text-sm font-medium text-faint ring-1 ring-border transition hover:text-bad hover:ring-bad/50 disabled:opacity-50"
    >
      {pending ? "Deleting…" : "Delete delivery"}
    </button>
  );
}
