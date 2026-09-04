"use client";

import { useActionState, useEffect, useRef } from "react";
import { setInitialPassword } from "@/app/actions";
import { Logo } from "@/components/brand/Logo";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { toast } from "@/lib/toast";

export default function ChangePasswordPage() {
  const [state, action, pending] = useActionState(setInitialPassword, {});
  const seen = useRef(state);
  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-sm rise">
        <div className="mb-8 flex flex-col items-start gap-6">
          <Logo />
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Set your password</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Choose a new password to finish setting up your admin account.
            </p>
          </div>
        </div>

        <form action={action} className="rounded-xl bg-surface p-6 ring-1 ring-border">
          <label htmlFor="pw" className="text-xs font-semibold uppercase tracking-wider text-faint">
            New password
          </label>
          <div className="mt-2">
            <PasswordInput
              id="pw"
              name="password"
              required
              autoFocus
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
            />
          </div>

          <label htmlFor="pw2" className="mt-4 block text-xs font-semibold uppercase tracking-wider text-faint">
            Confirm password
          </label>
          <div className="mt-2">
            <PasswordInput
              id="pw2"
              name="confirm"
              required
              autoComplete="new-password"
              placeholder="Repeat it"
              className="w-full rounded-lg bg-background px-3.5 py-3 text-[15px] text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full rounded-lg bg-accent px-4 py-3 text-[15px] font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
          >
            {pending ? <LoadingDots label="Saving" /> : "Save & continue"}
          </button>
          {state.error && <p className="mt-3 text-sm text-bad">{state.error}</p>}
        </form>
      </div>
    </main>
  );
}
