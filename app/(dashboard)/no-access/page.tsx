import { Logo } from "@/components/brand/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { getProfile } from "@/lib/auth";

export default async function NoAccessPage({ searchParams }: { searchParams: Promise<{ closed?: string }> }) {
  const { closed } = await searchParams;
  const profile = await getProfile();

  if (closed) {
    return (
      <main className="flex-1 grid place-items-center px-5 py-16">
        <div className="w-full max-w-md rise">
          <Logo />
          <h1 className="mt-8 font-display text-2xl font-semibold tracking-tight">This account has been closed</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            Your retainer has ended and the access period is over, so this dashboard is no longer available. If
            you&apos;d like to work together again, just reach out to the studio.
          </p>
          <div className="mt-7">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

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
