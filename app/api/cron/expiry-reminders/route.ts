import { NextResponse } from "next/server";
import { getAllClientViewsAdmin } from "@/lib/data-admin";
import { allRollovers } from "@/lib/aggregate";
import { sendMail, emailConfigured, emailLayout } from "@/lib/email";
import { shortDate, relativeDays } from "@/lib/format";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Email when rollover videos are within this many days of expiring.
const THRESHOLD_DAYS = 10;

/**
 * Daily cron: emails the admin a digest of clients whose rolled-over videos are
 * about to expire. Secured by CRON_SECRET (Vercel Cron sends it as a Bearer
 * token; you can also pass ?key=... for a manual test). Add ?dry=1 to preview
 * the recipients/payload without sending.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const bearer = request.headers.get("authorization") === `Bearer ${secret}`;
    const keyParam = searchParams.get("key") === secret;
    if (!bearer && !keyParam) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const views = await getAllClientViewsAdmin();
  const soon = allRollovers(views).filter(
    (r) => r.available > 0 && r.days != null && r.days <= THRESHOLD_DAYS,
  );

  const payload = soon.map((r) => ({
    client: r.clientName,
    videos: r.available,
    expires: r.nextExpiry ? shortDate(r.nextExpiry) : null,
    days: r.days,
  }));

  if (searchParams.get("dry") === "1") {
    return NextResponse.json({ dryRun: true, count: soon.length, items: payload });
  }

  if (soon.length === 0) {
    return NextResponse.json({ sent: false, reason: "nothing expiring", count: 0 });
  }

  if (!emailConfigured()) {
    return NextResponse.json({ sent: false, reason: "email not configured", count: soon.length, items: payload });
  }

  const rows = soon
    .map(
      (r) =>
        `<tr>
           <td style="padding:8px 0;color:#f3f6ee;">${r.clientName}</td>
           <td style="padding:8px 0;color:#c4f032;font-weight:700;text-align:right;">${r.available}</td>
           <td style="padding:8px 0;color:#b9c2ab;text-align:right;">${r.nextExpiry ? shortDate(r.nextExpiry) : "—"} · ${relativeDays(r.days)}</td>
         </tr>`,
    )
    .join("");

  const html = emailLayout(
    `${soon.length} client${soon.length === 1 ? "" : "s"} with rollover expiring soon`,
    `<p style="margin:0 0 16px;">These rolled-over videos expire within ${THRESHOLD_DAYS} days — they'll be lost with no refund if unused.</p>
     <table style="width:100%;border-collapse:collapse;font-size:14px;">
       <tr style="border-bottom:1px solid #3a4233;">
         <th style="text-align:left;color:#7d8a6e;font-size:11px;text-transform:uppercase;padding-bottom:8px;">Client</th>
         <th style="text-align:right;color:#7d8a6e;font-size:11px;text-transform:uppercase;padding-bottom:8px;">Videos</th>
         <th style="text-align:right;color:#7d8a6e;font-size:11px;text-transform:uppercase;padding-bottom:8px;">Expires</th>
       </tr>
       ${rows}
     </table>`,
  );

  await sendMail({
    to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.GMAIL_USER!,
    subject: `get48 · ${soon.reduce((s, r) => s + r.available, 0)} rollover videos expiring soon`,
    html,
  });

  return NextResponse.json({ sent: true, count: soon.length, items: payload });
}
