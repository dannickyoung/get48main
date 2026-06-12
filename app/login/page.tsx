"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { Check } from "iconoir-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  async function sendMagicLink() {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email first.");
      return;
    }
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
            <h1 className="font-display text-3xl font-semibold tracking-tight">Retainer control</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Sign in to manage retainers, track video usage and rollovers.
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
              We sent a one-time sign-in link to <span className="text-foreground">{email}</span>. Open it
              on this device to continue.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-5 text-sm font-medium text-accent hover:text-accent-hover"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={signInPassword} className="rounded-xl bg-surface p-6 ring-1 ring-border">
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
              placeholder="you@studio.com"
              className="mt-2 w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
            />

            {mode === "password" && (
              <>
                <label htmlFor="password" className="mt-4 block text-xs font-semibold uppercase tracking-wider text-faint">
                  Password
                </label>
                <div className="mt-2">
                  <PasswordInput
                    id="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
                >
                  {status === "sending" ? <LoadingDots label="Signing in" /> : "Sign in"}
                </button>
              </>
            )}

            {mode === "magic" && (
              <button
                type="button"
                onClick={sendMagicLink}
                disabled={status === "sending"}
                className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
              >
                {status === "sending" ? <LoadingDots label="Sending link" /> : "Send magic link"}
              </button>
            )}

            {status === "error" && <p className="mt-3 text-sm text-bad">{message}</p>}

            <div className="mt-4 border-t border-border pt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "password" ? "magic" : "password");
                  setStatus("idle");
                  setMessage("");
                }}
                className="text-sm font-medium text-faint transition hover:text-foreground"
              >
                {mode === "password"
                  ? "Client? Email me a sign-in link instead"
                  : "Use a password instead"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

