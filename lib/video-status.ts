import type { VideoStatus } from "@/lib/types";

export const VIDEO_STATUSES: { value: VideoStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "v1", label: "V1" },
  { value: "v2", label: "V2" },
  { value: "v3", label: "V3" },
  { value: "final", label: "Final" },
  { value: "completed", label: "Completed" },
];

const VALID = new Set<string>(VIDEO_STATUSES.map((o) => o.value));

export function videoStatusLabel(status: VideoStatus): string {
  return VIDEO_STATUSES.find((o) => o.value === status)?.label ?? "Completed";
}

/** Coerce arbitrary input (form value, legacy "in_progress", null) to a valid status. */
export function toVideoStatus(value: unknown): VideoStatus {
  if (value === "in_progress") return "v1"; // legacy value → first cut
  return typeof value === "string" && VALID.has(value) ? (value as VideoStatus) : "completed";
}
