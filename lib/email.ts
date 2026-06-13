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

/** Welcome email sent to a client when the studio adds them. */
export async function sendClientWelcome({ to, name }: { to: string; name: string }) {
  if (!emailConfigured()) return;
  const loginUrl = "https://get48.io/login/client";
  const first = (name || "").trim().split(/\s+/)[0] || "there";
  const body = `
    <p style="margin:0 0 14px;">Hi ${first},</p>
    <p style="margin:0 0 14px;">Great to have you on board. We've set up your get48 account so you can keep an eye on your retainer anytime: how many videos you've got this month, what's rolling over to next month, and where your payments stand.</p>
    <p style="margin:18px 0 8px;font-weight:600;color:#f3f6ee;">Signing in takes a few seconds:</p>
    <ol style="margin:0 0 16px;padding-left:18px;color:#b9c2ab;">
      <li style="margin-bottom:7px;">Go to <a href="${loginUrl}" style="color:#c4f032;">get48.io/login/client</a></li>
      <li style="margin-bottom:7px;">Enter your email address (${to})</li>
      <li style="margin-bottom:7px;">We'll email you a 6-digit code. Type it in and you're through.</li>
    </ol>
    <p style="margin:0 0 18px;">No password to remember. The code only works once and expires after an hour, so just ask for a fresh one whenever you want to log in.</p>
    <p style="margin:0 0 18px;">
      <a href="${loginUrl}" style="display:inline-block;background:#c4f032;color:#1a1f1a;font-weight:700;text-decoration:none;padding:11px 18px;border-radius:8px;">Open your dashboard</a>
    </p>
    <p style="margin:0 0 12px;">Any questions, just reply to this email and we'll help you out.</p>
    <p style="margin:0;">Talk soon,<br />The get48 team</p>
  `;
  await sendMail({ to, subject: "Welcome to get48, your dashboard is ready", html: emailLayout("Welcome to get48", body) });
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
