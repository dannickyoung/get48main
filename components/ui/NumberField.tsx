"use client";

import { useRef } from "react";
import { NavArrowUp, NavArrowDown } from "iconoir-react";

export function NumberField({
  name,
  defaultValue,
  min,
  max,
  step = 1,
  required,
  className = "",
  "aria-label": ariaLabel,
}: {
  name: string;
  defaultValue?: number | string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const bump = (dir: 1 | -1) => {
    const input = ref.current;
    if (!input) return;
    let v = Number(input.value || 0) + dir * step;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    input.value = String(Number(v.toFixed(4)));
  };

  return (
    <div className="relative">
      <input
        ref={ref}
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={min}
        max={max}
        step={step}
        required={required}
        aria-label={ariaLabel}
        className={`no-spin pr-9 ${className}`}
      />
      <div className="absolute inset-y-0 right-0 flex w-8 flex-col border-l border-border">
        <button type="button" tabIndex={-1} aria-label="Increase" onClick={() => bump(1)} className="grid flex-1 place-items-center rounded-tr-[inherit] text-faint transition hover:bg-surface-3 hover:text-foreground">
          <NavArrowUp width={13} height={13} strokeWidth={2} />
        </button>
        <button type="button" tabIndex={-1} aria-label="Decrease" onClick={() => bump(-1)} className="grid flex-1 place-items-center rounded-br-[inherit] border-t border-border text-faint transition hover:bg-surface-3 hover:text-foreground">
          <NavArrowDown width={13} height={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
