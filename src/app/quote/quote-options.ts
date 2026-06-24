export const serviceOptions = [
  { title: "Window Cleaning" },
  { title: "Pressure Washing" },
  { title: "Gutter Cleaning" },
  { title: "Landscaping" },
  { title: "Full Exterior Package" },
] as const;

export const FULL_EXTERIOR = "Full Exterior Package";

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
