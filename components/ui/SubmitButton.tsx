"use client";

import { useFormStatus } from "react-dom";
import { LoadingDots } from "@/components/ui/LoadingDots";

/**
 * Submit button for server-action forms. Shows animated loading dots while the
 * form is pending. Pass the normal label as children and an optional
 * pendingLabel (omit for dots-only on tight buttons).
 */
export function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-70`}>
      {pending ? <LoadingDots label={pendingLabel} /> : children}
    </button>
  );
}
