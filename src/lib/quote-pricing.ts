export const QUOTE_SERVICE_TITLES = [
  "Window Cleaning",
  "Pressure Washing",
  "Gutter Cleaning",
  "Landscaping",
  "Full Exterior Package",
] as const;

export type QuoteServiceTitle = (typeof QUOTE_SERVICE_TITLES)[number];

export interface QuoteServiceOption {
  title: QuoteServiceTitle;
  low: number;
  high: number;
}

export interface Estimate {
  low: number;
  high: number;
}

export const FULL_EXTERIOR: QuoteServiceTitle = "Full Exterior Package";

export const DEFAULT_QUOTE_SERVICE_OPTIONS: readonly QuoteServiceOption[] = [
  { title: "Window Cleaning", low: 150, high: 300 },
  { title: "Pressure Washing", low: 200, high: 450 },
  { title: "Gutter Cleaning", low: 120, high: 250 },
  { title: "Landscaping", low: 100, high: 400 },
  { title: "Full Exterior Package", low: 500, high: 1200 },
];

export function getDefaultQuoteServiceOptions(): QuoteServiceOption[] {
  return DEFAULT_QUOTE_SERVICE_OPTIONS.map((option) => ({ ...option }));
}

/**
 * Convert Firestore data into the complete public pricing list. Invalid or
 * missing entries fall back individually so the quote form always remains
 * usable even if the settings document is absent or malformed.
 */
export function normalizeQuoteServiceOptions(
  value: unknown,
): QuoteServiceOption[] {
  if (!Array.isArray(value)) return getDefaultQuoteServiceOptions();

  return DEFAULT_QUOTE_SERVICE_OPTIONS.map((fallback) => {
    const candidate = value.find(
      (item) =>
        item &&
        typeof item === "object" &&
        "title" in item &&
        item.title === fallback.title,
    );
    if (!candidate || typeof candidate !== "object") return { ...fallback };

    const low = "low" in candidate ? candidate.low : undefined;
    const high = "high" in candidate ? candidate.high : undefined;
    if (
      typeof low !== "number" ||
      !Number.isFinite(low) ||
      low < 0 ||
      typeof high !== "number" ||
      !Number.isFinite(high) ||
      high < low
    ) {
      return { ...fallback };
    }

    return { title: fallback.title, low, high };
  });
}

export function estimateForServices(
  titles: string[],
  options: readonly QuoteServiceOption[] = DEFAULT_QUOTE_SERVICE_OPTIONS,
): Estimate | null {
  let low = 0;
  let high = 0;
  let matched = false;

  for (const title of titles) {
    const option = options.find((item) => item.title === title.trim());
    if (!option) continue;
    matched = true;
    low += option.low;
    high += option.high;
  }

  return matched ? { low, high } : null;
}
