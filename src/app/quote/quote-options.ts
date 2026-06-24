// Ballpark price ranges shown to the customer as an instant estimate. These are
// intentionally wide — the real quote is confirmed after we review the property.
// Shared (no deps) so the server can recompute the estimate from the saved
// service titles rather than trusting a client-sent number.
export const serviceOptions = [
  { title: "Window Cleaning", low: 150, high: 300 },
  { title: "Pressure Washing", low: 200, high: 450 },
  { title: "Gutter Cleaning", low: 120, high: 250 },
  { title: "Landscaping", low: 100, high: 400 },
  { title: "Full Exterior Package", low: 500, high: 1200 },
] as const;

export const FULL_EXTERIOR = "Full Exterior Package";

export interface Estimate {
  low: number;
  high: number;
}

/**
 * Sum the ballpark range for the selected service titles. Returns null if
 * nothing maps (so callers can hide the estimate). Used by both the quote form
 * (live) and the server (recomputed from the saved titles, never trusted input).
 */
export function estimateForServices(titles: string[]): Estimate | null {
  let low = 0;
  let high = 0;
  let matched = false;
  for (const title of titles) {
    const opt = serviceOptions.find((o) => o.title === title.trim());
    if (!opt) continue;
    matched = true;
    low += opt.low;
    high += opt.high;
  }
  return matched ? { low, high } : null;
}

// Build the `service` summary string for a job. Notes are NOT embedded here —
// they're stored as a separate first-class `details` field on the job so the
// invoice line label stays clean and notes aren't capped by the 200-char cap.
export function buildServiceSummary(services: string[], meta = ""): string {
  const trimmed = services.map((s) => s.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  const serviceText = trimmed.join(", ");
  const metaText = meta.trim() ? ` | ${meta.trim()}` : "";
  return `${serviceText}${metaText}`.slice(0, 200);
}
