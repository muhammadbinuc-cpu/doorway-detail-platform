// 🔒 src/lib/promos.ts — Single source of truth for promo codes.
// Isomorphic (no server deps): used by the public quote form to validate/show
// a code, and by submitQuote to attach a real discount to the lead.

export interface Promo {
  code: string;
  // Flat dollar amount taken off the first service's invoice.
  discount: number;
  // Short customer-facing description shown on the quote form.
  label: string;
}

// Active promo codes. Add/expire codes here — this is the only place.
const PROMOS: Record<string, Promo> = {
  DOOR25: {
    code: "DOOR25",
    discount: 25,
    label: "$25 off your first service",
  },
  NEIGHBOUR50: {
    code: "NEIGHBOUR50",
    discount: 50,
    label: "$50 off — same-street neighbour rate",
  },
};

/** Normalize a raw code the same way everywhere (uppercase, strip noise). */
export function normalizePromoCode(raw: string | undefined | null): string {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 20);
}

/** Look up a valid promo, or null if the code is unknown/empty. */
export function lookupPromo(raw: string | undefined | null): Promo | null {
  const code = normalizePromoCode(raw);
  if (!code) return null;
  return PROMOS[code] ?? null;
}
