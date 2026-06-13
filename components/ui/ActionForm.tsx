"use client";

import { toast } from "@/lib/toast";

/**
 * Form wrapper for server actions that shows a success/error toast on completion.
 * Use for actions that revalidate (no redirect). Redirects bubble up normally.
 */
export function ActionForm({
  action,
  success,
  error = "Something went wrong",
  className,
  children,
}: {
  action: (formData: FormData) => Promise<unknown>;
  success?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      className={className}
      action={async (formData) => {
        try {
          await action(formData);
          if (success) toast.success(success);
        } catch (e: unknown) {
          // Let Next's redirect/notFound control-flow bubble up.
          const digest = (e as { digest?: string })?.digest;
          if (typeof digest === "string" && (digest.startsWith("NEXT_REDIRECT") || digest === "NEXT_NOT_FOUND")) {
            throw e;
          }
          toast.error(e instanceof Error && e.message ? e.message : error);
        }
      }}
    >
      {children}
    </form>
  );
}
