"use client";

import { useTransition } from "react";
import { setPayment } from "@/app/actions";

export function PaymentToggle({
  clientId,
  periodIndex,
  periodStart,
  kind,
  amount,
  paid,
}: {
  clientId: string;
  periodIndex: number;
  periodStart: string;
  kind: "deposit" | "balance";
  amount: number;
  paid: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() =>
        start(() =>
          setPayment({ clientId, periodIndex, periodStart, kind, amount, paid: !paid }),
        )
      }
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
        paid ? "tint-accent" : "tint-muted hover:text-foreground"
      }`}
      title={paid ? "Mark as unpaid" : "Mark as paid"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-accent" : "bg-faint"}`} />
      {paid ? "Paid" : "Mark paid"}
    </button>
  );
}
