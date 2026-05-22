import { buildServiceSummary, FULL_EXTERIOR } from "../src/app/quote/quote-options";

describe("buildServiceSummary", () => {
  test("single service, no notes", () => {
    expect(buildServiceSummary(["Window Cleaning"], "")).toBe("Window Cleaning");
  });

  test("multiple services, no notes", () => {
    expect(buildServiceSummary(["Window Cleaning", "Gutter Cleaning"], ""))
      .toBe("Window Cleaning, Gutter Cleaning");
  });

  test("services + notes appended", () => {
    expect(buildServiceSummary(["Pressure Washing"], "Side gate access"))
      .toBe("Pressure Washing | Notes: Side gate access");
  });

  test("full exterior package", () => {
    expect(buildServiceSummary([FULL_EXTERIOR], "")).toBe("Full Exterior Package");
  });

  test("empty array returns empty string (caller validates)", () => {
    expect(buildServiceSummary([], "")).toBe("");
    expect(buildServiceSummary([], "some notes")).toBe("");
  });

  test("trims whitespace and filters falsy entries", () => {
    expect(buildServiceSummary(["  Window Cleaning  ", "", "Landscaping"], "  "))
      .toBe("Window Cleaning, Landscaping");
  });

  test("summary stays under 200 char Firestore-safe cap", () => {
    const long = Array(20).fill("Window Cleaning").join(", ");
    const result = buildServiceSummary([long], "x".repeat(500));
    expect(result.length).toBeLessThanOrEqual(200);
  });

  test("appends meta string when provided (campaign attribution)", () => {
    expect(buildServiceSummary(["Window Cleaning"], "", "promo: DOOR25 src: doorhanger"))
      .toBe("Window Cleaning | promo: DOOR25 src: doorhanger");
  });

  test("services + notes + meta all combined", () => {
    expect(buildServiceSummary(["Pressure Washing"], "Side gate access", "promo: DOOR25 src: doorhanger"))
      .toBe("Pressure Washing | Notes: Side gate access | promo: DOOR25 src: doorhanger");
  });

  test("empty meta is ignored", () => {
    expect(buildServiceSummary(["Window Cleaning"], "", "")).toBe("Window Cleaning");
    expect(buildServiceSummary(["Window Cleaning"], "", "   ")).toBe("Window Cleaning");
  });
});
