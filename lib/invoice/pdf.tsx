/**
 * The invoice PDF — a faithful reproduction of the studio's invoice layout,
 * rendered server-side with @react-pdf/renderer (no browser needed).
 */
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { format } from "date-fns";
import type { InvoiceData } from "./build";
import { INVOICE_BUSINESS, invoiceMoney } from "./config";
import { PAYNOW_QR_DATA_URI } from "./paynow-qr";

// Never hyphenate words ("Insta-gram") — wrap whole words like the original.
Font.registerHyphenationCallback((word) => [word]);

const C = {
  ink: "#111111",
  body: "#333333",
  muted: "#666666",
  faint: "#8a8a8a",
  rule: "#e3e3e3",
  ruleStrong: "#111111",
  green: "#3f8f1f",
  lime: "#9be32b",
  headerBg: "#1e2126",
  boxBg: "#f6f6f6",
  boxBorder: "#e6e6e6",
  paid: "#2f7d16",
  paidBg: "#e8f6df",
  partial: "#9a5b00",
  partialBg: "#fff3d6",
};

const s = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 56, paddingHorizontal: 42, fontFamily: "Helvetica", fontSize: 10, color: C.body },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  h1: { fontFamily: "Helvetica-Bold", fontSize: 28, color: C.ink, letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 10, color: C.muted },
  badge: { alignSelf: "flex-end", backgroundColor: C.lime, color: C.ink, fontFamily: "Helvetica-Bold", fontSize: 11, paddingVertical: 4, paddingHorizontal: 9, borderRadius: 5 },
  fromLine: { fontSize: 10, color: C.muted, textAlign: "right", marginTop: 3 },
  greenRule: { height: 3, backgroundColor: C.green, marginTop: 16, marginBottom: 16 },
  eyebrow: { fontSize: 8, letterSpacing: 1, color: C.muted, fontFamily: "Helvetica-Bold" },
  billName: { marginTop: 7, fontSize: 12, fontFamily: "Helvetica-Bold", color: C.ink },
  billLine: { marginTop: 4, fontSize: 10.5, color: C.body },
  metaRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  metaLabel: { fontSize: 10.5, color: C.muted, marginRight: 4 },
  metaValue: { fontSize: 10.5, color: C.ink, fontFamily: "Helvetica-Bold" },
  tableHead: { flexDirection: "row", backgroundColor: C.headerBg, color: "#ffffff", paddingVertical: 8, paddingHorizontal: 12, marginTop: 20, borderRadius: 2 },
  th: { fontSize: 8, fontFamily: "Helvetica-Bold", letterSpacing: 0.8 },
  lineRow: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 9, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: C.rule },
  lineTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink },
  lineDesc: { marginTop: 4, fontSize: 9.5, color: C.muted, lineHeight: 1.4 },
  cellNum: { fontSize: 10.5, color: C.body, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 300, marginTop: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, paddingHorizontal: 12 },
  totalLabel: { fontSize: 11, color: C.ink },
  totalValue: { fontSize: 11, color: C.ink },
  totalDue: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 9, paddingHorizontal: 12, borderTopWidth: 2, borderTopColor: C.ruleStrong },
  totalDueLabel: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.ink },
  totalDueValue: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.green },
  box: { marginTop: 16, backgroundColor: C.boxBg, borderWidth: 1, borderColor: C.boxBorder, borderRadius: 6, paddingVertical: 12, paddingHorizontal: 20 },
  schedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 7 },
  schedLabel: { fontSize: 10.5, color: C.body, flex: 1, paddingRight: 12 },
  schedAmount: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: C.ink },
  pill: { fontSize: 7.5, fontFamily: "Helvetica-Bold", letterSpacing: 0.6, paddingVertical: 2.5, paddingHorizontal: 6, borderRadius: 3, marginLeft: 8 },
  qrWrap: { width: 132, height: 132, backgroundColor: C.boxBg, borderWidth: 1, borderColor: C.boxBorder, borderRadius: 6, padding: 8, alignItems: "center", justifyContent: "center" },
  qr: { width: 112, height: 115 },
  note: { flex: 1, paddingLeft: 28, justifyContent: "center" },
  noteText: { fontSize: 10.5, color: C.body, lineHeight: 1.55 },
  bold: { fontFamily: "Helvetica-Bold", color: C.ink },
  footer: { position: "absolute", left: 42, right: 42, bottom: 26, borderTopWidth: 1, borderTopColor: C.rule, paddingTop: 12, textAlign: "center", fontSize: 10, color: C.muted },
  paidBox: { marginTop: 14, backgroundColor: C.paidBg, borderWidth: 1, borderColor: "#cfe9bd", borderRadius: 6, paddingVertical: 12, paddingHorizontal: 20 },
  statusPill: { marginLeft: 12, fontSize: 8.5, fontFamily: "Helvetica-Bold", letterSpacing: 1, paddingVertical: 3.5, paddingHorizontal: 8, borderRadius: 4 },
});

const COLS = { qty: 40, rate: 88, amount: 92 };

/** Render "text with **bold** segments" as mixed-weight Text. */
function Rich({ text }: { text: string }) {
  const parts = text.split("**");
  return (
    <Text style={s.noteText}>
      {parts.map((p, i) => (i % 2 === 1 ? <Text key={i} style={s.bold}>{p}</Text> : <Text key={i}>{p}</Text>))}
    </Text>
  );
}

const shortDate = (d: Date | string) => format(typeof d === "string" ? new Date(d) : d, "d MMM yyyy");

export function InvoiceDocument({ inv }: { inv: InvoiceData }) {
  return (
    <Document title={`Invoice ${inv.number}`} author={inv.from.name} subject={`${inv.from.subtitle} — ${inv.billingPeriod}`}>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.between}>
          <View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={s.h1}>INVOICE</Text>
              {inv.status === "paid" && (
                <Text style={[s.statusPill, { backgroundColor: C.paidBg, color: C.paid }]}>PAID IN FULL</Text>
              )}
              {inv.status === "partial" && (
                <Text style={[s.statusPill, { backgroundColor: C.partialBg, color: C.partial }]}>DEPOSIT RECEIVED</Text>
              )}
            </View>
            <Text style={s.subtitle}>{inv.from.subtitle}</Text>
          </View>
          <View>
            <Text style={s.badge}>{inv.from.name}</Text>
            <Text style={[s.fromLine, { marginTop: 10 }]}>{inv.from.contact}</Text>
            <Text style={s.fromLine}>{inv.from.email}</Text>
            <Text style={s.fromLine}>{inv.from.location}</Text>
          </View>
        </View>
        <View style={s.greenRule} />

        {/* Bill to + meta */}
        <View style={s.between}>
          <View>
            <Text style={s.eyebrow}>BILL TO</Text>
            <Text style={s.billName}>{inv.billTo.name}</Text>
            {inv.billTo.company ? <Text style={s.billLine}>{inv.billTo.company}</Text> : null}
            <Text style={s.billLine}>{inv.billTo.email}</Text>
          </View>
          <View>
            <Meta label="Invoice No." value={inv.number} />
            <Meta label="Issue date" value={shortDate(inv.issueDate)} />
            <Meta label="Due date" value={inv.dueDateLabel} />
            <Meta label="Billing period" value={inv.billingPeriod} />
          </View>
        </View>

        {/* Line items */}
        <View style={s.tableHead}>
          <Text style={[s.th, { flex: 1 }]}>DESCRIPTION</Text>
          <Text style={[s.th, { width: COLS.qty, textAlign: "right" }]}>QTY</Text>
          <Text style={[s.th, { width: COLS.rate, textAlign: "right" }]}>RATE</Text>
          <Text style={[s.th, { width: COLS.amount, textAlign: "right" }]}>AMOUNT</Text>
        </View>
        {inv.lines.map((l, i) => (
          <View key={i} style={s.lineRow} wrap={false}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={s.lineTitle}>{l.title}</Text>
              <Text style={s.lineDesc}>{l.description}</Text>
            </View>
            <Text style={[s.cellNum, { width: COLS.qty }]}>{l.qty}</Text>
            <Text style={[s.cellNum, { width: COLS.rate }]}>{invoiceMoney(l.rate)}</Text>
            <Text style={[s.cellNum, { width: COLS.amount }]}>{invoiceMoney(l.amount)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Subtotal</Text>
            <Text style={s.totalValue}>{invoiceMoney(inv.subtotal)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Tax</Text>
            <Text style={s.totalValue}>{invoiceMoney(inv.tax)}</Text>
          </View>
          <View style={s.totalDue}>
            <Text style={s.totalDueLabel}>Total due</Text>
            <Text style={s.totalDueValue}>{invoiceMoney(inv.total)}</Text>
          </View>
        </View>

        {/* Payment schedule */}
        <View style={s.box} wrap={false}>
          <Text style={s.eyebrow}>PAYMENT SCHEDULE</Text>
          {inv.schedule.map((r, i) => (
            <View key={i} style={s.schedRow}>
              <Text style={s.schedLabel}>{r.label}</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={s.schedAmount}>{invoiceMoney(r.amount)}</Text>
                {r.status === "paid" ? (
                  <Text style={[s.pill, { backgroundColor: C.paidBg, color: C.paid }]}>
                    PAID{r.paidOn ? ` ${shortDate(r.paidOn).toUpperCase()}` : ""}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        {/* Payment method — kept together; moves whole to the next page if it can't fit.
            Fully-paid invoices are receipts: no QR, just the paid confirmation. */}
        {inv.status === "paid" ? (
          <View style={s.paidBox} wrap={false}>
            <Text style={s.eyebrow}>PAYMENT RECEIVED</Text>
            <View style={{ marginTop: 6 }}>
              {inv.paymentNote.map((t, i) => (
                <Rich key={i} text={t} />
              ))}
            </View>
          </View>
        ) : (
          <View wrap={false}>
            <Text style={[s.eyebrow, { marginTop: 14 }]}>PAYMENT METHOD — {INVOICE_BUSINESS.paymentMethodLabel.toUpperCase()}</Text>
            <View style={[s.row, { marginTop: 10 }]}>
              <View style={s.qrWrap}>
                <Image src={PAYNOW_QR_DATA_URI} style={s.qr} />
              </View>
              <View style={s.note}>
                {inv.paymentNote.map((t, i) => (
                  <Rich key={i} text={t} />
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Footer — pinned to the bottom of every page */}
        <Text style={s.footer} fixed>
          {INVOICE_BUSINESS.footerThanks}  ·  {inv.from.name}  ·  {inv.from.email}
        </Text>
      </Page>
    </Document>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.metaRow}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
    </View>
  );
}

/** Render the invoice to a PDF buffer (Node runtime only). */
export async function renderInvoicePdf(inv: InvoiceData): Promise<Buffer> {
  const buf = await renderToBuffer(<InvoiceDocument inv={inv} />);
  return Buffer.from(buf);
}
