"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/lib/toast";

/**
 * Fires a toast from a ?toast=...&toastType=... query param, then strips it.
 * Lets server actions that REDIRECT still surface a toast on the landing page.
 */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const msg = params.get("toast");
    if (!msg) return;
    const type = (params.get("toastType") as "success" | "warning" | "error") || "success";
    (toast[type] ?? toast.success)(msg);

    const next = new URLSearchParams(Array.from(params.entries()));
    next.delete("toast");
    next.delete("toastType");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [params, pathname, router]);

  return null;
}
