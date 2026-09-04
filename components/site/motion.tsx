"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? doc.scrollTop / max : 0);
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="scroll-progress"
      style={{ ["--scroll" as string]: progress }}
      aria-hidden
    />
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

type RevealLineProps = {
  children: React.ReactNode;
  from?: "left" | "right";
  autoplay?: boolean;
  delay?: number;
  className?: string;
};

export function RevealLine({
  children,
  from = "left",
  autoplay = false,
  delay = 0,
  className = "",
}: RevealLineProps) {
  const outerRef = useRef<HTMLSpanElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useIsoLayoutEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    if (reduced) {
      inner.style.transform = "translate3d(0,0,0)";
      inner.style.clipPath = "inset(0 0 0 0)";
      inner.style.opacity = "1";
      return;
    }

    if (autoplay) {
      inner.style.transition =
        "transform 1100ms cubic-bezier(0.16,1,0.3,1), clip-path 1100ms cubic-bezier(0.16,1,0.3,1), opacity 800ms ease-out";
      inner.style.transitionDelay = `${delay}ms`;
      const raf = requestAnimationFrame(() => {
        if (!inner) return;
        inner.style.transform = "translate3d(0,0,0)";
        inner.style.clipPath = "inset(0 0 0 0)";
        inner.style.opacity = "1";
      });
      return () => cancelAnimationFrame(raf);
    }

    const section = outer.closest("section");
    let frame = 0;

    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!outer || !inner) return;
        const rect = outer.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const sectionTop = section ? section.getBoundingClientRect().top : 0;
        const offsetInSection = Math.max(0, rect.top - sectionTop);
        const span = Math.max(120, vh - offsetInSection);
        const distanceAbove = vh - rect.top;
        const p = Math.min(1, Math.max(0, distanceAbove / span));

        const rest = 1 - p;
        const shift = rest * 80;
        const tx = from === "left" ? -shift : shift;
        const clipR = from === "left" ? (rest * 100).toFixed(2) : "0";
        const clipL = from === "right" ? (rest * 100).toFixed(2) : "0";
        inner.style.transform = `translate3d(${tx.toFixed(2)}px, 0, 0)`;
        inner.style.clipPath = `inset(0 ${clipR}% 0 ${clipL}%)`;
        inner.style.opacity = p.toFixed(3);
      });
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [from, reduced, autoplay, delay]);

  return (
    <span ref={outerRef} className={`block ${className}`}>
      <span
        ref={innerRef}
        className="inline-block will-change-[transform,clip-path,opacity]"
        style={{
          transform:
            from === "left"
              ? "translate3d(-80px,0,0)"
              : "translate3d(80px,0,0)",
          clipPath:
            from === "left" ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)",
          opacity: 0,
        }}
      >
        {children}
      </span>
    </span>
  );
}

type RevealProps = {
  children: React.ReactNode;
  delay?: 0 | 1 | 2 | 3;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
};

export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className = "",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const delayClass =
    delay === 1
      ? " reveal-delay-1"
      : delay === 2
        ? " reveal-delay-2"
        : delay === 3
          ? " reveal-delay-3"
          : "";

  const Component = Tag as React.ElementType;
  return (
    <Component
      ref={ref}
      className={`reveal${visible ? " is-visible" : ""}${delayClass} ${className}`}
    >
      {children}
    </Component>
  );
}
