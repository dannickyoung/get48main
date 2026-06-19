import type { VideoStatus } from "@/lib/types";
import { videoStatusLabel } from "@/lib/video-status";

const TONE: Record<VideoStatus, { dot: string; text: string; ring: string }> = {
  not_started: { dot: "bg-faint", text: "text-muted", ring: "ring-border" },
  v1: { dot: "bg-warn", text: "text-warn", ring: "ring-warn/30" },
  v2: { dot: "bg-warn", text: "text-warn", ring: "ring-warn/30" },
  v3: { dot: "bg-warn", text: "text-warn", ring: "ring-warn/30" },
  final: { dot: "bg-accent", text: "text-accent", ring: "ring-accent/30" },
  completed: { dot: "bg-accent", text: "text-accent", ring: "ring-accent/30" },
};

export function VideoStatusBadge({ status }: { status: VideoStatus }) {
  const t = TONE[status] ?? TONE.completed;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium ring-1 ${t.ring} ${t.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} aria-hidden />
      {videoStatusLabel(status)}
    </span>
  );
}
