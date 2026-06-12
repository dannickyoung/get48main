import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/SignOutButton";

export function Header({
  email,
  roleLabel,
  homeHref = "/",
}: {
  email: string;
  roleLabel: string;
  homeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href={homeHref} className="flex items-center gap-3">
          <Logo />
        </Link>
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="hidden text-right sm:block">
            <div className="text-[13px] font-medium leading-tight text-foreground">{email}</div>
            <div className="text-[11px] uppercase tracking-wider text-faint">{roleLabel}</div>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
