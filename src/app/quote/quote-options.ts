export const serviceOptions = [
  {
    title: "Window Cleaning",
    details: ["Exterior windows", "Interior windows", "Screens", "Tracks and frames"],
  },
  {
    title: "Pressure Washing",
    details: ["Driveway", "Walkways", "Patio or deck", "Fence or siding"],
  },
  {
    title: "Gutter Cleaning",
    details: ["Gutter debris removal", "Downspout flushing", "Soffit or fascia", "Exterior fixtures"],
  },
  {
    title: "Landscaping",
    details: ["Weed removal", "Edging", "Garden cleanup", "Seasonal tidy-up"],
  },
  {
    title: "Full Exterior Package",
    details: ["Windows", "Pressure washing", "Gutters", "Property tidy-up"],
  },
];

export function buildServiceSummary(category: string, details: string[], notes: string): string {
  const detailText = details.length > 0 ? details.join(", ") : "General request";
  const noteText = notes.trim() ? ` | Notes: ${notes.trim()}` : "";
  return `${category}: ${detailText}${noteText}`.slice(0, 200);
}
