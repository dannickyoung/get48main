import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { getClientView } from "@/lib/data";
import { buildInvoice } from "@/lib/invoice/build";
import { renderInvoicePdf } from "@/lib/invoice/pdf";
import type { Invoice } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/invoices/[id] → the invoice PDF.
 *   - Admins can download any invoice, any time.
 *   - Clients can download their own month's invoice once at least one payment
 *     for that month has been marked paid (it then shows the paid status).
 * Add ?inline=1 to open in the browser tab instead of downloading.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const profile = await getProfile();
  if (!profile || (profile.role !== "admin" && profile.role !== "client")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS already scopes this: admins see all, clients only their own client's rows.
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle();
  const invoice = data as Invoice | null;
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (profile.role === "client" && invoice.client_id !== profile.client_id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const view = await getClientView(invoice.client_id);
  if (!view) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inv = buildInvoice(view, invoice);
  if (!inv) return NextResponse.json({ error: "This month hasn't been billed yet" }, { status: 409 });

  if (profile.role === "client" && inv.status === "unpaid") {
    return NextResponse.json({ error: "Invoice available once a payment is recorded" }, { status: 403 });
  }

  const pdf = await renderInvoicePdf(inv);
  const inline = new URL(request.url).searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdf.byteLength),
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${inv.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
