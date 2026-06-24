import {
  estimateForServices,
  getDefaultQuoteServiceOptions,
  normalizeQuoteServiceOptions,
} from "../src/lib/quote-pricing";
import { validateQuotePricing } from "../src/lib/validation";

describe("quote pricing", () => {
  test("combines configured ranges for selected services", () => {
    const options = getDefaultQuoteServiceOptions().map((option) =>
      option.title === "Window Cleaning"
        ? { ...option, low: 175, high: 325 }
        : option,
    );

    expect(
      estimateForServices(
        ["Window Cleaning", "Pressure Washing"],
        options,
      ),
    ).toEqual({ low: 375, high: 775 });
  });

  test("returns null when no selected title matches", () => {
    expect(estimateForServices(["Unknown Service"])).toBeNull();
  });

  test("uses defaults for an absent settings document", () => {
    expect(normalizeQuoteServiceOptions(undefined)).toEqual(
      getDefaultQuoteServiceOptions(),
    );
  });

  test("falls back only for a malformed stored range", () => {
    const stored = getDefaultQuoteServiceOptions();
    stored[0] = { ...stored[0], low: 500, high: 100 };
    stored[1] = { ...stored[1], low: 250, high: 500 };

    const normalized = normalizeQuoteServiceOptions(stored);
    expect(normalized[0]).toEqual({
      title: "Window Cleaning",
      low: 150,
      high: 300,
    });
    expect(normalized[1]).toEqual({
      title: "Pressure Washing",
      low: 250,
      high: 500,
    });
  });

  test("rejects a maximum below the minimum", () => {
    const options = getDefaultQuoteServiceOptions();
    options[0] = { ...options[0], low: 400, high: 300 };
    expect(() => validateQuotePricing(options)).toThrow(
      "Maximum price must be greater than or equal to minimum price",
    );
  });

  test("requires every public quote service exactly once", () => {
    const options = getDefaultQuoteServiceOptions();
    options[1] = { ...options[0] };
    expect(() => validateQuotePricing(options)).toThrow(
      "Each quote service must appear exactly once",
    );
  });
});
