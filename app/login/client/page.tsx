"use client";

import { useState } from "react";
import { Check } from "iconoir-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { LoadingDots } from "@/components/ui/LoadingDots";

export default function ClientLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm rise">
        <div className="mb-9 flex flex-col items-start gap-6">
          <Logo />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Client sign in</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              View your retainer, deliveries and payments.
            </p>
          </div>
        </div>

        {status === "sent" ? (
          <div className="rounded-xl bg-surface p-6 ring-1 ring-border">
            <div className="grid h-11 w-11 place-items-center rounded-full tint-accent">
              <Check width={22} height={22} strokeWidth={2} />
            </div>
            <h2 className="mt-4 font-display text-lg font-semibold">Check your inbox</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              We sent a one-time sign-in link to <span className="text-foreground">{email}</span>. Open it on
              this device to view your account.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="rounded-xl bg-surface p-6 ring-1 ring-border">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-faint">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-2 w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
            >
              {status === "sending" ? <LoadingDots label="Sending link" /> : "Email me a sign-in link"}
            </button>
            {status === "error" && <p className="mt-3 text-sm text-bad">{message}</p>}
            <p className="mt-4 text-xs leading-relaxed text-faint">
              No password needed. We&apos;ll email you a secure one-time link to view your retainer.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
