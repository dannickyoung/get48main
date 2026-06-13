import type { VideoStatus } from "@/lib/types";

export const VIDEO_STATUSES: { value: VideoStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export function videoStatusLabel(status: VideoStatus): string {
  return VIDEO_STATUSES.find((o) => o.value === status)?.label ?? "Completed";
}

/** Coerce arbitrary input (form value, legacy null) to a valid status. */
export function toVideoStatus(value: unknown): VideoStatus {
  return value === "not_started" || value === "in_progress" || value === "completed"
    ? value
    : "completed";
}
