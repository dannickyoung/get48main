import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { PreviewToggle } from "@/components/PreviewToggle";

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
          <Link href="/preview" className="flex items-center gap-3">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <PreviewToggle />
            <Link href="/login" className="hidden text-sm font-medium text-faint transition hover:text-foreground sm:block">
              Exit
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-6 rounded-xl bg-surface px-4 py-3 text-sm text-muted ring-1 ring-border">
          You&apos;re viewing the dashboard with fabricated clients — no login or Supabase needed. The numbers
          are computed by the real rollover engine. Add your keys to use it for real.
        </div>
        {children}
      </div>
    </>
  );
}
