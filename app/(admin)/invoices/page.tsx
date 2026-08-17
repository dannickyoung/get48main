import Link from "next/link";
import { Download, MultiplePages, OpenNewWindow } from "iconoir-react";
import { getAllClientViews } from "@/lib/data";
import { buildInvoice, type InvoiceData } from "@/lib/invoice/build";
import { INVOICE_BUSINESS, invoiceMoney } from "@/lib/invoice/config";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pill } from "@/components/ui/StatusPill";
import { shortDate } from "@/lib/format";

type Row = { id: string; clientId: string; clientName: string; inv: InvoiceData };

const linkCls =
  "inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-xs font-semibold text-foreground ring-1 ring-border transition hover:bg-surface-3 hover:text-accent";

export default async function InvoicesPage() {
  const views = await getAllClientViews();
  const rows: Row[] = [];
  for (const v of views) {
    for (const invoice of v.invoices) {
      const inv = buildInvoice(v, invoice);
      if (inv) rows.push({ id: invoice.id, clientId: v.client.id, clientName: v.client.name, inv });
    }
  }
  rows.sort((a, b) => b.inv.number.localeCompare(a.inv.number));

  return (
    <div className="rise space-y-6">
      <div>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Invoices</h1>
          <p className="mt-1.5 text-[15px] text-muted">
            One invoice per client per retainer month, issued automatically the day a month starts and numbered{" "}
            {INVOICE_BUSINESS.numberPrefix}001, 002… Paid months become receipts the client can download.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<MultiplePages width={28} height={28} strokeWidth={1.2} />}
          title="No invoices yet"
          description="Invoices are issued automatically as soon as a client's first retainer month starts."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-faint">
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-3 py-3 font-semibold">Client</th>
                  <th className="px-3 py-3 font-semibold">Billing period</th>
                  <th className="px-3 py-3 font-semibold">Issued</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">PDF</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold text-foreground">{r.inv.number}</td>
                    <td className="px-3 py-3">
                      <Link href={`/clients/${r.clientId}`} className="font-medium text-foreground hover:text-accent">
                        {r.clientName}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-muted">{r.inv.billingPeriod}</td>
                    <td className="px-3 py-3 text-muted">{shortDate(r.inv.issueDate)}</td>
                    <td className="px-3 py-3 text-right font-semibold">{invoiceMoney(r.inv.total)}</td>
                    <td className="px-3 py-3">
                      <Pill tone={r.inv.status === "paid" ? "good" : r.inv.status === "partial" ? "warn" : "muted"}>
                        {r.inv.status === "paid" ? "Paid" : r.inv.status === "partial" ? "Deposit paid" : "Unpaid"}
                      </Pill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <a href={`/api/invoices/${r.id}?inline=1`} target="_blank" rel="noreferrer" className={linkCls} title="Open in a new tab">
                          <OpenNewWindow width={14} height={14} strokeWidth={2} /> Preview
                        </a>
                        <a href={`/api/invoices/${r.id}`} className={linkCls} download>
                          <Download width={14} height={14} strokeWidth={2} /> Download
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
