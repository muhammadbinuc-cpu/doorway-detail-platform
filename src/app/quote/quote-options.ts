export const serviceOptions = [
  { title: "Window Cleaning" },
  { title: "Pressure Washing" },
  { title: "Gutter Cleaning" },
  { title: "Landscaping" },
  { title: "Full Exterior Package" },
] as const;

export const FULL_EXTERIOR = "Full Exterior Package";

export function buildServiceSummary(services: string[], notes: string, meta = ""): string {
  const trimmed = services.map((s) => s.trim()).filter(Boolean);
  if (trimmed.length === 0) return "";
  const serviceText = trimmed.join(", ");
  const noteText = notes.trim() ? ` | Notes: ${notes.trim()}` : "";
  const metaText = meta.trim() ? ` | ${meta.trim()}` : "";
  return `${serviceText}${noteText}${metaText}`.slice(0, 200);
}
