/**
 * Studio details printed on every invoice. Edit here (or override the email
 * with INVOICE_EMAIL in .env.local) — the PDF is rendered from these values.
 */
export const INVOICE_BUSINESS = {
  /** Badge + footer name. */
  name: "Get48",
  contact: "Dannick Young",
  email: process.env.INVOICE_EMAIL || "dannickyoung@outlook.com",
  location: "Singapore",
  /** Subtitle under the INVOICE heading. */
  subtitle: "Social Media Video Editing — Monthly Retainer",
  /** Invoice numbers look like GET48RET001 (prefix + 3-digit running number). */
  numberPrefix: "GET48RET",
  /** Currency label used on the invoice (amounts are billed in SGD). */
  currency: "S$",
  dueDateLabel: "Upon receipt",
  paymentMethodLabel: "PayNow only",
  footerThanks: "Thank you for your business.",
} as const;

/** Format an amount the way the invoice does: S$2,400.00 (always two decimals). */
export function invoiceMoney(n: number): string {
  const v = Number(n) || 0;
  return `${INVOICE_BUSINESS.currency}${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
