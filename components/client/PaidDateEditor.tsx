"use client";

import { useTransition } from "react";
import { DateField } from "@/components/ui/DateField";
import { setPayment } from "@/app/actions";
import { toast } from "@/lib/toast";
import type { PaymentKind } from "@/lib/types";

/** Admin-only inline editor for a paid payment's date. */
export function PaidDateEditor({
  clientId,
  periodIndex,
  periodStart,
  kind,
  amount,
  paidOn,
}: {
  clientId: string;
  periodIndex: number;
  periodStart: string;
  kind: PaymentKind;
  amount: number;
  paidOn: string;
}) {
  const [pending, start] = useTransition();

  return (
    <div className={`flex w-fit items-center gap-1 text-xs text-faint tnum ${pending ? "opacity-50" : ""}`}>
      <span>paid</span>
      <DateField
        defaultValue={paidOn}
        className="text-xs font-medium text-foreground"
        onChange={(value) => {
          if (!value || value === paidOn) return;
          start(async () => {
            try {
              await setPayment({ clientId, periodIndex, periodStart, kind, amount, paid: true, paidOn: value });
              toast.success("Paid date updated");
            } catch {
              toast.error("Couldn't update paid date");
            }
          });
        }}
      />
    </div>
  );
}
