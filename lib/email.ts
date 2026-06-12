import "server-only";
import nodemailer from "nodemailer";

/** Gmail SMTP transport via app password. Returns null if not configured. */
function transport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

export function emailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const t = transport();
  if (!t) throw new Error("Email not configured (GMAIL_USER / GMAIL_APP_PASSWORD)");
  return t.sendMail({ from: `get48 <${process.env.GMAIL_USER}>`, to, subject, html });
}

/** Branded email wrapper — dark, lime accent, matches the dashboard. */
export function emailLayout(title: string, body: string) {
  return `
  <div style="background:#1a1f1a;padding:32px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#23291f;border:1px solid #3a4233;border-radius:14px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid #3a4233;">
        <span style="display:inline-block;background:#c4f032;color:#1a1f1a;font-weight:800;font-size:13px;padding:5px 8px;border-radius:7px;">48</span>
        <span style="color:#f3f6ee;font-weight:700;font-size:15px;margin-left:8px;">get48</span>
      </div>
      <div style="padding:28px;">
        <h1 style="color:#f3f6ee;font-size:20px;margin:0 0 14px;">${title}</h1>
        <div style="color:#b9c2ab;font-size:14px;line-height:1.6;">${body}</div>
      </div>
    </div>
  </div>`;
}
