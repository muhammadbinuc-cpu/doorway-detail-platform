import {
  buildServiceSummary,
  FULL_EXTERIOR,
} from "../src/app/quote/quote-options";

describe("buildServiceSummary", () => {
  test("single service", () => {
    expect(buildServiceSummary(["Window Cleaning"])).toBe("Window Cleaning");
  });

  test("multiple services", () => {
    expect(buildServiceSummary(["Window Cleaning", "Gutter Cleaning"])).toBe(
      "Window Cleaning, Gutter Cleaning",
    );
  });

  test("full exterior package", () => {
    expect(buildServiceSummary([FULL_EXTERIOR])).toBe("Full Exterior Package");
  });

  test("empty array returns empty string (caller validates)", () => {
    expect(buildServiceSummary([])).toBe("");
  });

  test("trims whitespace and filters falsy entries", () => {
    expect(
      buildServiceSummary(["  Window Cleaning  ", "", "Landscaping"]),
    ).toBe("Window Cleaning, Landscaping");
  });

  test("notes are NOT embedded in the service summary", () => {
    // Notes now live in a separate `details` field — the summary is services only.
    expect(buildServiceSummary(["Pressure Washing"])).toBe("Pressure Washing");
  });

  test("summary stays under 200 char Firestore-safe cap", () => {
    const long = Array(40).fill("Window Cleaning").join(", ");
    const result = buildServiceSummary([long]);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  test("appends meta string when provided (campaign attribution)", () => {
    expect(
      buildServiceSummary(["Window Cleaning"], "promo: DOOR25 src: doorhanger"),
    ).toBe("Window Cleaning | promo: DOOR25 src: doorhanger");
  });

  test("empty meta is ignored", () => {
    expect(buildServiceSummary(["Window Cleaning"], "")).toBe(
      "Window Cleaning",
    );
    expect(buildServiceSummary(["Window Cleaning"], "   ")).toBe(
      "Window Cleaning",
    );
  });
});
