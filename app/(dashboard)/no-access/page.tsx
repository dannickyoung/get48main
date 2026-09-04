import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { getProfile } from "@/lib/auth";

export default async function NoAccessPage() {
  const profile = await getProfile();

  return (
    <main className="flex-1 grid place-items-center px-5 py-16">
      <div className="w-full max-w-md rise">
        <Logo />
        <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight">
          You&apos;re signed in, but not set up yet
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">
          {profile?.email ? (
            <>
              <span className="text-foreground">{profile.email}</span> isn&apos;t linked to a client
              account yet. Ask the studio to add this email, then sign in again — your dashboard
              will appear automatically.
            </>
          ) : (
            <>This account isn&apos;t linked to a client yet.</>
          )}
        </p>
        <div className="mt-7">
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
