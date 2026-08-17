/**
 * Additional videos: extras an admin adds to one billing month on top of the
 * month's set allotment. Each carries a quantity and a per-video cost.
 * The charge is quantity × cost, billed on the month-end payment row.
 */

/** Cost per additional video must fall within this inclusive range (USD). */
export const ADDITIONAL_VIDEO_COST_MIN = 0;
export const ADDITIONAL_VIDEO_COST_MAX = 1000;

export function isValidAdditionalVideoCost(cost: number): boolean {
  return Number.isFinite(cost) && cost >= ADDITIONAL_VIDEO_COST_MIN && cost <= ADDITIONAL_VIDEO_COST_MAX;
}

/** Total charge for a month's additional videos. */
export function additionalVideosCharge(count: number, costPerVideo: number): number {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const c = Math.max(0, Number(costPerVideo) || 0);
  return n * c;
}
