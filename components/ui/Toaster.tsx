"use client";

import { useEffect, useState } from "react";
import { Check, WarningTriangle, WarningCircle } from "iconoir-react";
import { subscribe, dismiss, type ToastItem, type ToastType } from "@/lib/toast";

const META: Record<ToastType, { icon: React.ReactNode; color: string }> = {
  success: { icon: <Check width={16} height={16} strokeWidth={2.2} />, color: "text-accent" },
  warning: { icon: <WarningTriangle width={16} height={16} strokeWidth={2} />, color: "text-warn" },
  error: { icon: <WarningCircle width={16} height={16} strokeWidth={2} />, color: "text-bad" },
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => subscribe(setItems), []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          onClick={() => dismiss(t.id)}
          className={`pointer-events-auto flex max-w-[92vw] items-center gap-2.5 rounded-lg bg-surface-3 px-4 py-3 text-sm shadow-2xl ring-1 ring-border-strong ${
            t.leaving ? "toast-out" : "toast-in"
          }`}
        >
          <span className={META[t.type].color}>{META[t.type].icon}</span>
          <span className="font-medium text-foreground">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
