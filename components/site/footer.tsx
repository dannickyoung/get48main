export function SiteFooter() {
  return (
    <footer>
      <div className="mx-auto flex w-full max-w-[90rem] flex-wrap items-center justify-between gap-4 px-6 py-8 font-sans text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:px-10">
        <span>© {new Date().getFullYear()} Get48</span>
        <div className="flex flex-wrap items-center gap-6">
          <a href="#" className="transition-colors hover:text-foreground">
            Privacy
          </a>
          <a href="#" className="transition-colors hover:text-foreground">
            Terms
          </a>
          <span>Built for speed</span>
        </div>
      </div>
    </footer>
  );
}
