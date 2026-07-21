"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, NavArrowLeft, NavArrowRight } from "iconoir-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

function parse(s: string | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
const iso = (d: Date) => format(d, "yyyy-MM-dd");

export function DateField({
  name,
  defaultValue,
  required,
  className = "",
  onChange,
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
  className?: string;
  /** Called with the new yyyy-mm-dd value (or "" when cleared) on each pick. */
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const commit = (v: string) => {
    setValue(v);
    onChange?.(v);
  };
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parse(defaultValue) ?? new Date());
  const anchorRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Position the popup (fixed) below the anchor, flipping/clamping to stay on-screen.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect();
      if (!a) return;
      const W = 288; // w-72
      const H = popRef.current?.offsetHeight ?? 320;
      const gap = 8;
      let top = a.bottom + gap;
      if (top + H > window.innerHeight - 8 && a.top - gap - H > 8) top = a.top - gap - H;
      let left = a.left;
      left = Math.min(left, window.innerWidth - W - 8);
      left = Math.max(8, left);
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (anchorRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = parse(value);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(view), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(view), { weekStartsOn: 0 }),
  });

  return (
    <div className="relative inline-block">
      {name && <input type="hidden" name={name} value={value} required={required} />}
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center justify-between gap-2 text-left ${className} ${value ? "" : "text-faint"}`}
      >
        <span>{selected ? format(selected, "d MMM yyyy") : "Select date"}</span>
        <Calendar width={16} height={16} strokeWidth={1.7} className="shrink-0 text-faint" />
      </button>

      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popRef}
          style={{ position: "fixed", top: pos?.top ?? -9999, left: pos?.left ?? -9999, visibility: pos ? "visible" : "hidden" }}
          className="z-50 w-72 rounded-xl bg-surface-2 p-3 shadow-2xl ring-1 ring-border-strong">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => setView((v) => addMonths(v, -1))} className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-surface-3 hover:text-foreground">
              <NavArrowLeft width={18} height={18} />
            </button>
            <span className="font-display text-sm font-semibold">{format(view, "MMMM yyyy")}</span>
            <button type="button" onClick={() => setView((v) => addMonths(v, 1))} className="grid h-8 w-8 place-items-center rounded-md text-muted transition hover:bg-surface-3 hover:text-foreground">
              <NavArrowRight width={18} height={18} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="py-1 text-[10px] font-semibold uppercase text-faint">{d}</span>
            ))}
            {days.map((day) => {
              const isSel = selected && isSameDay(day, selected);
              const inMonth = isSameMonth(day, view);
              const isToday = isSameDay(day, new Date());
              return (
                <button
                  key={iso(day)}
                  type="button"
                  onClick={() => {
                    commit(iso(day));
                    setOpen(false);
                  }}
                  className={`grid h-9 place-items-center rounded-md text-sm tnum transition ${
                    isSel
                      ? "bg-accent font-semibold text-on-accent"
                      : inMonth
                        ? "text-foreground hover:bg-surface-3"
                        : "text-faint hover:bg-surface-3"
                  } ${isToday && !isSel ? "ring-1 ring-accent/50" : ""}`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { commit(""); setOpen(false); }} className="text-xs font-medium text-faint hover:text-foreground">
              Clear
            </button>
            <button
              type="button"
              onClick={() => { const t = new Date(); commit(iso(t)); setView(t); setOpen(false); }}
              className="text-xs font-medium text-accent hover:text-accent-hover"
            >
              Today
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
