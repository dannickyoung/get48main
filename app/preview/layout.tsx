import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PreviewSidebar } from "@/components/PreviewSidebar";
import { PreviewToggle } from "@/components/PreviewToggle";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <PreviewSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar (sidebar is hidden < lg) */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/85 px-5 backdrop-blur-xl lg:hidden">
          <Link href="/preview">
            <Logo />
          </Link>
          <PreviewToggle />
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
          <div className="mb-6 rounded-lg bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
            You&apos;re viewing the dashboard with fabricated clients — no login or Supabase needed. The numbers
            are computed by the real rollover engine.
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
