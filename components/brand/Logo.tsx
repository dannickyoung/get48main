export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-[0.6rem] bg-accent font-display text-[15px] font-bold leading-none text-on-accent"
        style={{ boxShadow: "0 0 0 1px oklch(0.87 0.205 128 / 0.4), 0 6px 20px -8px oklch(0.87 0.205 128 / 0.7)" }}
      >
        48
      </span>
      {!compact && (
        <span className="font-display text-[17px] font-semibold tracking-tight">
          get<span className="text-accent">48</span>
        </span>
      )}
    </span>
  );
}
