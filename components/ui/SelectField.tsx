import type { SelectHTMLAttributes } from "react";

/**
 * Native <select> with the browser arrow replaced by a custom chevron that sits
 * a comfortable distance from the right edge (native arrows hug the border and
 * ignore padding-right on most browsers).
 */
export function SelectField({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${className} appearance-none pr-10`}>
        {children}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
      >
        <path d="M5.5 8l4.5 4.5L14.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
