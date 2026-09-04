import type { Metadata } from "next";
import { SubpageNav } from "@/components/site/subpage-nav";
import { SiteFooter } from "@/components/site/footer";
import { Reveal, RevealLine, ScrollProgress } from "@/components/site/motion";
import { ReelCard } from "@/components/site/reel-card";
import { REEL_TIERS, type Accent } from "@/lib/social-case-studies";

export const metadata: Metadata = {
  title: "Social media case studies · Get48",
  description: "Basic Cut, Standard Reel and Premium Reel case studies from Get48.",
};

const ACCENT_TEXT: Record<Accent, string> = {
  violet: "text-violet",
  orange: "text-orange",
  green: "text-green",
};

export default function SocialMediaPage() {
  return (
    <>
      <ScrollProgress />
      <SubpageNav links={REEL_TIERS.map((t) => ({ href: `#${t.id}`, label: t.name }))} />

      <main>

        {REEL_TIERS.map((tier, i) => (
          <section
            key={tier.id}
            id={tier.id}
            className={`relative scroll-mt-20 py-20 sm:py-28 ${
              i === 0 ? "pt-32 sm:pt-40" : "border-t border-border/40"
            }`}
          >
            <div className="mx-auto w-full max-w-[120rem] px-6 sm:px-10">
              <Reveal className="mb-12 flex flex-col gap-3 sm:mb-16">
                <span className={`font-sans text-[11px] uppercase tracking-[0.22em] ${ACCENT_TEXT[tier.accent]}`}>
                  {tier.index}
                </span>
                <h2 className="font-display text-4xl uppercase leading-[0.9] tracking-[-0.02em] text-foreground/90 sm:text-6xl">
                  <RevealLine from="left">{tier.name}</RevealLine>
                </h2>
              </Reveal>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,20rem))] justify-center gap-8 sm:justify-start">
                {tier.reels.map((reel, i) => (
                  <Reveal key={reel.slug} delay={((i % 3) + 1) as 1 | 2 | 3}>
                    <ReelCard reel={reel} accent={tier.accent} />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>

      <SiteFooter />
    </>
  );
}
