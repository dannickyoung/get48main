"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/app/actions";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { LoadingDots } from "@/components/ui/LoadingDots";
import { toast } from "@/lib/toast";

const inputCls =
  "w-full rounded-lg bg-background px-3.5 py-2.5 text-sm text-foreground ring-1 ring-border transition placeholder:text-faint focus:ring-2 focus:ring-accent";
const labelCls = "text-xs font-semibold uppercase tracking-wider text-faint";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  const seen = useRef(state);

  useEffect(() => {
    if (state === seen.current) return;
    seen.current = state;
    if (state.ok) toast.success("Password updated");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="mt-5 grid max-w-md gap-4">
      <label className="block">
        <span className={labelCls}>New password</span>
        <div className="mt-1.5">
          <PasswordInput name="password" required autoComplete="new-password" placeholder="At least 8 characters" className={inputCls} />
        </div>
      </label>
      <label className="block">
        <span className={labelCls}>Confirm password</span>
        <div className="mt-1.5">
          <PasswordInput name="confirm" required autoComplete="new-password" placeholder="Repeat it" className={inputCls} />
        </div>
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? <LoadingDots label="Saving" /> : "Update password"}
        </button>
        {state.ok && <span className="text-sm font-medium text-accent">Password updated.</span>}
        {state.error && <span className="text-sm text-bad">{state.error}</span>}
      </div>
    </form>
  );
}
