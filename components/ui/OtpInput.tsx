"use client";

import { useRef } from "react";

/** Segmented 6-digit code input: auto-advances, supports paste, calls onComplete when full. */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  length = 6,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  length?: number;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function set(next: string) {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  }

  function handleChange(i: number, raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    if (digits.length > 1) {
      // Paste: fill from position i.
      const next = (value.slice(0, i) + digits).replace(/\D/g, "").slice(0, length);
      set(next);
      refs.current[Math.min(next.length, length - 1)]?.focus();
      return;
    }
    const arr = value.split("");
    arr[i] = digits;
    const next = arr.join("").slice(0, length);
    set(next);
    if (i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = value.split("");
      if (arr[i]) {
        arr[i] = "";
        set(arr.join(""));
      } else if (i > 0) {
        arr[i - 1] = "";
        set(arr.join(""));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <div className="flex gap-2">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          disabled={disabled}
          autoFocus={i === 0}
          aria-label={`Digit ${i + 1}`}
          className="h-12 min-w-0 flex-1 rounded-lg bg-background text-center font-display text-xl font-semibold text-foreground ring-1 ring-border transition focus:ring-2 focus:ring-accent disabled:opacity-60"
        />
      ))}
    </div>
  );
}
