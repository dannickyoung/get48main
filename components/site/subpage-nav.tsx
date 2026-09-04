"use client";

import { useEffect, useState } from "react";

type SubpageNavProps = {
  links?: { href: string; label: string }[];
};

export function SubpageNav({ links = [] }: SubpageNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setScrolled(window.scrollY > 24));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-500 ${
        scrolled
          ? "border-b border-border/60 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[120rem] items-center justify-between px-6 sm:px-10">
        {/* Plain anchor on purpose: "/" is served by a different zone (the dashboard app). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          aria-label="Get48 — home"
          className="inline-flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <span className="grid h-7 w-7 place-items-center rounded-sm bg-orange font-sans text-[11px] font-bold leading-none tracking-[0.04em] text-black">
            48
          </span>
          <span className="font-display text-lg uppercase leading-none tracking-[-0.01em] text-foreground">
            Get48
          </span>
        </a>

        <div className="flex items-center gap-8">
          {links.length > 0 && (
            <nav aria-label="Page sections" className="hidden items-center gap-6 md:flex">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="font-sans text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
