import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";

export const metadata: Metadata = {
  title: "get48 — Coming soon",
  description: "Short-form video, on retainer. Something is coming.",
};

// Public marketing root. Replace this with your real landing page whenever
// it's ready — the dashboard app lives entirely under /dashboard.
export default function ComingSoon() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="rise flex flex-col items-center">
        <Logo />
        <span className="mt-10 inline-flex items-center gap-2 rounded-full tint-accent px-3 py-1 text-xs font-semibold uppercase tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Coming soon
        </span>
        <h1 className="mt-6 max-w-2xl font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Short-form video,
          <br />
          <span className="text-accent">on retainer.</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          We&apos;re putting the finishing touches on something good. Check back soon.
        </p>
      </div>
      <footer className="absolute bottom-6 text-xs text-faint">© get48</footer>
    </main>
  );
}
