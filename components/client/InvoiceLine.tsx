import { Download, OpenNewWindow } from "iconoir-react";
import { createInvoice, updateInvoice } from "@/app/actions";
import { ActionForm } from "@/components/ui/ActionForm";
import { DateField } from "@/components/ui/DateField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Pill } from "@/components/ui/StatusPill";
import { shortDate } from "@/lib/format";
import type { Invoice } from "@/lib/types";

const inputCls =
  "w-full rounded-lg bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent";
const linkCls =
  "inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-surface-3 hover:text-accent";

/**
 * The invoice strip under a billing month in the Payments card.
 *   admin  → create / download / preview / edit number + date
 *   client → download once at least one payment for the month is paid
 */
export function InvoiceLine({
  clientId,
  periodIndex,
  invoice,
  paidCount,
  rowCount,
  readOnly,
}: {
  clientId: string;
  periodIndex: number;
  invoice: Invoice | undefined;
  paidCount: number;
  rowCount: number;
  readOnly: boolean;
}) {
  const fullyPaid = rowCount > 0 && paidCount === rowCount;

  // ----- client view -----
  if (readOnly) {
    if (!invoice || paidCount === 0) return null;
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-medium tnum">Invoice {invoice.invoice_no}</span>
          <Pill tone={fullyPaid ? "good" : "warn"}>{fullyPaid ? "Paid" : "Deposit paid"}</Pill>
        </div>
        <a href={`/api/invoices/${invoice.id}`} className={linkCls} download>
          <Download width={14} height={14} strokeWidth={2} /> Download PDF
        </a>
      </div>
    );
  }

  // ----- admin view -----
  if (!invoice) {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
        <span className="text-xs text-faint">No invoice issued for this month yet.</span>
        <ActionForm action={createInvoice.bind(null, clientId, periodIndex)} success="Invoice created">
          <SubmitButton
            pendingLabel="Creating"
            className="rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Create invoice
          </SubmitButton>
        </ActionForm>
      </div>
    );
  }

  return (
    <details className="group/inv mt-4 rounded-xl bg-surface-2 px-4 py-3">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-medium tnum">Invoice {invoice.invoice_no}</span>
          <span className="text-xs text-faint tnum">issued {shortDate(invoice.issue_date)}</span>
          <Pill tone={fullyPaid ? "good" : paidCount > 0 ? "warn" : "muted"}>
            {fullyPaid ? "Paid" : paidCount > 0 ? "Deposit paid" : "Unpaid"}
          </Pill>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/api/invoices/${invoice.id}?inline=1`} target="_blank" rel="noreferrer" className={linkCls} title="Open in a new tab">
            <OpenNewWindow width={14} height={14} strokeWidth={2} /> Preview
          </a>
          <a href={`/api/invoices/${invoice.id}`} className={linkCls} download>
            <Download width={14} height={14} strokeWidth={2} /> Download PDF
          </a>
          <span className="text-xs text-faint group-open/inv:text-accent">
            <span className="group-open/inv:hidden">Edit</span>
            <span className="hidden group-open/inv:inline">Close</span>
          </span>
        </div>
      </summary>
      <ActionForm
        action={updateInvoice.bind(null, invoice.id, clientId)}
        success="Invoice updated"
        className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-[1fr_1fr_auto]"
      >
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Invoice number</span>
          <input name="invoice_no" defaultValue={invoice.invoice_no} required className={`mt-1.5 ${inputCls} tnum`} />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-faint">Issue date</span>
          <div className="mt-1.5">
            <DateField name="issue_date" defaultValue={invoice.issue_date} required className={inputCls} />
          </div>
        </label>
        <div className="col-span-2 flex items-end sm:col-span-1">
          <SubmitButton
            pendingLabel="Saving"
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-on-accent transition hover:bg-accent-hover sm:w-auto"
          >
            Save
          </SubmitButton>
        </div>
      </ActionForm>
    </details>
  );
}
