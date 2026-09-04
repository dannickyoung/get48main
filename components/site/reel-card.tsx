"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { formatDuration, type Accent, type Reel } from "@/lib/social-case-studies";

const PLAY_EVENT = "get48:reel-play";

type Mode = "idle" | "preview" | "playing" | "paused";

const ACCENT = {
  violet: { ring: "border-violet/70", dot: "bg-violet", text: "text-violet", bar: "bg-violet" },
  orange: { ring: "border-orange/70", dot: "bg-orange", text: "text-orange", bar: "bg-orange" },
  green: { ring: "border-green/70", dot: "bg-green", text: "text-green", bar: "bg-green" },
} satisfies Record<Accent, Record<string, string>>;

type ReelCardProps = {
  reel: Reel;
  accent: Accent;
};

export function ReelCard({ reel, accent }: ReelCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mode, setMode] = useState<Mode>("idle");
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const styles = ACCENT[accent];

  // Only one reel plays at a time across the page.
  useEffect(() => {
    function onOtherPlay(e: Event) {
      const other = (e as CustomEvent<string>).detail;
      if (other === reel.slug) return;
      const v = videoRef.current;
      if (!v || v.paused) return;
      v.pause();
      setMode((m) => (m === "playing" ? "paused" : "idle"));
    }
    window.addEventListener(PLAY_EVENT, onOtherPlay);
    return () => window.removeEventListener(PLAY_EVENT, onOtherPlay);
  }, [reel.slug]);

  // Pause when scrolled out of view.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting || v.paused) return;
        v.pause();
        setMode((m) => (m === "playing" ? "paused" : "idle"));
      },
      { threshold: 0.2 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const play = useCallback(
    async (withSound: boolean) => {
      const v = videoRef.current;
      if (!v) return;
      v.muted = withSound ? muted : true;
      window.dispatchEvent(new CustomEvent(PLAY_EVENT, { detail: reel.slug }));
      try {
        await v.play();
        setMode(withSound ? "playing" : "preview");
      } catch {
        // Autoplay blocked or interrupted; leave the poster in place.
      }
    },
    [muted, reel.slug]
  );

  function onPointerEnter(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || mode !== "idle") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void play(false);
  }

  function onPointerLeave(e: React.PointerEvent) {
    if (e.pointerType !== "mouse" || mode !== "preview") return;
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setProgress(0);
    setMode("idle");
  }

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (mode === "playing") {
      v.pause();
      setMode("paused");
      return;
    }
    if (mode === "preview") v.currentTime = 0;
    void play(true);
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const v = videoRef.current;
    const next = !muted;
    setMuted(next);
    if (v) v.muted = next;
  }

  function onTimeUpdate() {
    const v = videoRef.current;
    if (!v || !v.duration) return;
    setProgress(v.currentTime / v.duration);
  }

  const showPlayGlyph = mode === "idle" || mode === "paused";
  const engaged = mode === "playing" || mode === "paused";

  return (
    <figure className="group/reel flex w-full flex-col gap-5">
      <div
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={`relative aspect-[9/16] w-full overflow-hidden rounded-[1.75rem] border bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.08)] transition-[border-color,transform] duration-500 ${
          engaged ? styles.ring : "border-white/10 group-hover/reel:border-white/20"
        }`}
      >
        <video
          ref={videoRef}
          src={reel.src}
          poster={reel.poster}
          preload="metadata"
          playsInline
          loop
          onTimeUpdate={onTimeUpdate}
          className="absolute inset-0 h-full w-full object-cover"
        >
          Your browser does not support the video tag.
        </video>

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-500 ${
            mode === "playing" ? "opacity-0" : "opacity-100"
          }`}
        />

        <button
          type="button"
          onClick={togglePlay}
          aria-label={mode === "playing" ? `Pause ${reel.title}` : `Play ${reel.title}`}
          className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        >
          <span
            className={`grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-white/15 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-md transition-all duration-500 ${
              showPlayGlyph ? "scale-100 opacity-100" : "scale-75 opacity-0"
            }`}
          >
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
          <span
            className={`absolute inset-0 grid place-items-center transition-opacity duration-300 ${
              mode === "playing" ? "opacity-0 group-hover/reel:opacity-100" : "opacity-0"
            }`}
          >
            <span className="grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-black/40 text-foreground backdrop-blur-md">
              <Pause className="h-5 w-5 fill-current" />
            </span>
          </span>
        </button>

        <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-foreground backdrop-blur-md">
          <span
            className={`h-1.5 w-1.5 rounded-full ${styles.dot} ${mode === "playing" ? "animate-pulse-dot" : ""}`}
          />
          {formatDuration(reel.duration)}
        </div>

        {mode === "preview" && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/15 bg-black/50 px-3 py-1 font-sans text-[10px] uppercase tracking-[0.18em] text-foreground/90 backdrop-blur-md rise">
            Click for sound
          </div>
        )}

        {engaged && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute" : "Mute"}
            className="absolute bottom-4 right-4 z-20 grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-white/15 bg-black/50 text-foreground backdrop-blur-md transition-colors hover:bg-black/70"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[3px] bg-white/10">
          <div
            className={`h-full ${styles.bar} transition-[width] duration-200 ease-linear`}
            style={{ width: `${Math.min(100, progress * 100)}%` }}
          />
        </div>
      </div>

      <figcaption className="flex items-baseline justify-between gap-4 font-sans text-[11px] uppercase tracking-[0.22em]">
        <span className="text-foreground">{reel.client}</span>
        <span className="text-muted-foreground">{reel.title}</span>
      </figcaption>
    </figure>
  );
}
