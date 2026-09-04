export type Accent = "violet" | "orange" | "green";

export type Reel = {
  slug: string;
  client: string;
  title: string;
  /** Seconds */
  duration: number;
  src: string;
  poster: string;
};

export type ReelTier = {
  id: string;
  index: string;
  name: string;
  accent: Accent;
  reels: Reel[];
};

const BASE = "/case-studies/social";

function reel(slug: string, client: string, title: string, duration: number): Reel {
  return { slug, client, title, duration, src: `${BASE}/${slug}.mp4`, poster: `${BASE}/${slug}.jpg` };
}

export const REEL_TIERS: ReelTier[] = [
  {
    id: "basic-cut",
    index: "01",
    name: "Basic Cut",
    accent: "violet",
    reels: [
      reel("homedesign", "Home Design", "Lit bookshelf reveal", 30),
      reel("cpg-canberra", "Canberra Plaza", "Family route", 20),
    ],
  },
  {
    id: "standard-reel",
    index: "02",
    name: "Standard Reel",
    accent: "orange",
    reels: [
      reel("guilds-zenith", "Guilds", "Zenith standing desk", 24),
      reel("world-cup-roulette", "Camel", "World Cup roulette", 35),
    ],
  },
  {
    id: "premium-reel",
    index: "03",
    name: "Premium Reel",
    accent: "green",
    reels: [
      reel("vici-x-calent", "Calent", "They applied", 25),
      reel("imperial-reel", "Imperial Harvest", "4 signs", 66),
    ],
  },
];

export function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
