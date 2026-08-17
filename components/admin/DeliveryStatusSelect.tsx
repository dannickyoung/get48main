"use client";

import { useTransition } from "react";
import { setDeliveryStatus } from "@/app/actions";
import { toast } from "@/lib/toast";
import { VIDEO_STATUSES } from "@/lib/video-status";
import type { VideoStatus } from "@/lib/types";

const TONE: Record<VideoStatus, string> = {
  not_started: "text-muted ring-border",
  v1: "text-warn ring-warn/30",
  v2: "text-warn ring-warn/30",
  v3: "text-warn ring-warn/30",
  final: "text-accent ring-accent/30",
  completed: "text-accent ring-accent/30",
};

/** A status pill that's secretly a <select> — change it and the row updates in place. */
export function DeliveryStatusSelect({ videoId, clientId, status }: { videoId: string; clientId: string; status: VideoStatus }) {
  const [pending, start] = useTransition();
  return (
    <span
      className={`relative inline-flex items-center ${pending ? "opacity-60" : ""}`}
      // May live inside a <summary>: don't let a click on the select toggle the row.
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <span className={`pointer-events-none absolute left-2.5 h-1.5 w-1.5 rounded-full ${status === "not_started" ? "bg-faint" : status === "final" || status === "completed" ? "bg-accent" : "bg-warn"}`} />
      <select
        aria-label="Delivery status"
        value={status}
        disabled={pending}
        onChange={(e) =>
          start(async () => {
            try {
              await setDeliveryStatus(videoId, clientId, e.target.value);
              toast.success("Status updated");
            } catch {
              toast.error("Couldn't update status");
            }
          })
        }
        className={`field-select cursor-pointer rounded-full bg-surface-2 py-1 pl-6 text-xs font-medium ring-1 transition hover:bg-surface-3 focus:ring-2 focus:ring-accent ${TONE[status] ?? TONE.completed}`}
      >
        {VIDEO_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </span>
  );
}
