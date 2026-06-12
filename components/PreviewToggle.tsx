"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function PreviewToggle() {
  const pathname = usePathname();
  const clientActive = pathname === "/preview/client";

  return (
    <div className="flex rounded-lg bg-surface p-1 ring-1 ring-border">
      <Link
        href="/preview"
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          !clientActive ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
        }`}
      >
        Admin
      </Link>
      <Link
        href="/preview/client"
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
          clientActive ? "bg-surface-3 text-foreground" : "text-faint hover:text-muted"
        }`}
      >
        Client
      </Link>
    </div>
  );
}
