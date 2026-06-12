/** Animated three-dot loading indicator. Inherits the current text colour. */
export function LoadingDots({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {label}
      <span className="inline-flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot h-1.5 w-1.5 rounded-full bg-current"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
    </span>
  );
}
