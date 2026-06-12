"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { toast } from "@/lib/toast";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [status, setStatus] = useState<"idle" | "sending" | "verifying" | "error">("idle");
  const [message, setMessage] = useState("");

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      toast.error(error.message || "Couldn't send code");
    } else {
      setStep("code");
      setStatus("idle");
      setCode("");
      toast.success("Code sent — check your email");
    }
  }

  async function verify(codeStr: string) {
    setStatus("verifying");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: codeStr, type: "email" });
    if (error) {
      setStatus("error");
      setMessage("That code is invalid or expired.");
      toast.error("Invalid or expired code");
      setCode("");
    } else {
      toast.success("Signed in");
      router.push("/");
      router.refresh();
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
              {step === "email"
                ? "View your retainer, deliveries and payments."
                : `Enter the 6-digit code we emailed to ${email}.`}
            </p>
          </div>
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="rounded-xl bg-surface p-6 ring-1 ring-border">
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
              {status === "sending" ? <LoadingDots label="Sending code" /> : "Email me a code"}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-faint">
              No password needed. We&apos;ll email you a 6-digit code to sign in.
            </p>
          </form>
        ) : (
          <div className="rounded-xl bg-surface p-6 ring-1 ring-border">
            <label htmlFor="code" className="text-xs font-semibold uppercase tracking-wider text-faint">
              6-digit code
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              disabled={status === "verifying"}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                setStatus("idle");
                if (v.length === 6) verify(v);
              }}
              placeholder="000000"
              className="mt-2 w-full rounded-lg bg-background px-4 py-3 text-left font-display text-2xl font-semibold tracking-[0.5em] text-foreground ring-1 ring-border transition placeholder:text-faint/50 focus:ring-2 focus:ring-accent disabled:opacity-60"
            />

            <button
              type="button"
              onClick={() => code.length === 6 && verify(code)}
              disabled={status === "verifying" || code.length !== 6}
              className="mt-4 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-50"
            >
              {status === "verifying" ? <LoadingDots label="Verifying" /> : "Verify & sign in"}
            </button>
            {status === "error" && <p className="mt-3 text-sm text-bad">{message}</p>}

            <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
              <button onClick={() => { setStep("email"); setStatus("idle"); }} className="font-medium text-faint transition hover:text-foreground">
                Change email
              </button>
              <button onClick={() => sendCode()} disabled={status === "sending"} className="font-medium text-accent transition hover:text-accent-hover disabled:opacity-50">
                {status === "sending" ? "Sending…" : "Resend code"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
