"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/brand/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { toast } from "@/lib/toast";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      toast.error(error.message || "Couldn't sign in");
    } else {
      toast.success("Signed in");
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm rise">
        <div className="mb-9 flex flex-col items-start gap-6">
          <Logo />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Admin sign in</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Manage retainers, video usage, rollovers and payments.
            </p>
          </div>
        </div>

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
            placeholder="you@studio.com"
            className="mt-2 w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
          />

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
            className="mt-5 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
          >
            {status === "sending" ? <LoadingDots label="Signing in" /> : "Sign in"}
          </button>
          {status === "error" && <p className="mt-3 text-sm text-bad">{message}</p>}
        </form>
      </div>
    </main>
  );
}
