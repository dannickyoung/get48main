export function SignOutButton({ subtle = false }: { subtle?: boolean }) {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className={
          subtle
            ? "text-sm font-medium text-faint transition hover:text-foreground"
            : "rounded-lg bg-surface-2 px-4 py-2.5 text-sm font-medium text-muted ring-1 ring-border transition hover:text-foreground hover:ring-border-strong"
        }
      >
        Sign out
      </button>
    </form>
  );
}
