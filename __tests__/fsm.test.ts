import { isValidTransition } from "../src/lib/fsm_logic";

describe("Finite State Machine (FSM) Logic", () => {
  test("should allow valid progression: LEAD -> SCHEDULED", () => {
    expect(isValidTransition("LEAD_RECEIVED", "SCHEDULED")).toBe(true);
  });

  test("should allow valid progression: SCHEDULED -> COMPLETED", () => {
    expect(isValidTransition("SCHEDULED", "COMPLETED")).toBe(true);
  });

  test("should allow valid progression: COMPLETED -> INVOICED", () => {
    expect(isValidTransition("COMPLETED", "INVOICED")).toBe(true);
  });

  test("should allow valid progression: INVOICED -> PAID", () => {
    expect(isValidTransition("INVOICED", "PAID")).toBe(true);
  });

  test("should allow valid progression: INVOICED -> UNPAID", () => {
    expect(isValidTransition("INVOICED", "UNPAID")).toBe(true);
  });

  test("should BLOCK illegal jump: LEAD -> PAID", () => {
    expect(isValidTransition("LEAD_RECEIVED", "PAID")).toBe(false);
  });

  test("should BLOCK illegal jump: SCHEDULED -> INVOICED (must complete first)", () => {
    expect(isValidTransition("SCHEDULED", "INVOICED")).toBe(false);
  });

  test("should BLOCK illegal jump: INVOICED -> LOST", () => {
    expect(isValidTransition("INVOICED", "LOST")).toBe(false);
  });

  test("should allow Admin Override to SCHEDULED from any state", () => {
    expect(isValidTransition("CANCELLED", "SCHEDULED")).toBe(true);
    expect(isValidTransition("PAID", "SCHEDULED")).toBe(true);
    expect(isValidTransition("LOST", "SCHEDULED")).toBe(true);
  });

  test("should allow LEAD -> LOST or CANCELLED", () => {
    expect(isValidTransition("LEAD_RECEIVED", "LOST")).toBe(true);
    expect(isValidTransition("LEAD_RECEIVED", "CANCELLED")).toBe(true);
  });

  test("should allow voiding an invoice: INVOICED -> CANCELLED", () => {
    expect(isValidTransition("INVOICED", "CANCELLED")).toBe(true);
  });

  test("should allow voiding an overdue invoice: UNPAID -> CANCELLED", () => {
    expect(isValidTransition("UNPAID", "CANCELLED")).toBe(true);
  });

  test("should BLOCK voiding a paid invoice: PAID -> CANCELLED", () => {
    expect(isValidTransition("PAID", "CANCELLED")).toBe(false);
  });

  test("should allow sending a quote: LEAD_RECEIVED -> QUOTE_SENT", () => {
    expect(isValidTransition("LEAD_RECEIVED", "QUOTE_SENT")).toBe(true);
  });

  test("should allow booking an accepted quote: QUOTE_SENT -> SCHEDULED", () => {
    expect(isValidTransition("QUOTE_SENT", "SCHEDULED")).toBe(true);
  });

  test("should allow losing/cancelling a quoted job", () => {
    expect(isValidTransition("QUOTE_SENT", "LOST")).toBe(true);
    expect(isValidTransition("QUOTE_SENT", "CANCELLED")).toBe(true);
  });

  test("should BLOCK skipping ahead from a quote: QUOTE_SENT -> INVOICED/PAID", () => {
    expect(isValidTransition("QUOTE_SENT", "INVOICED")).toBe(false);
    expect(isValidTransition("QUOTE_SENT", "PAID")).toBe(false);
  });

  test("should BLOCK quoting after work started: SCHEDULED/COMPLETED -> QUOTE_SENT", () => {
    expect(isValidTransition("SCHEDULED", "QUOTE_SENT")).toBe(false);
    expect(isValidTransition("COMPLETED", "QUOTE_SENT")).toBe(false);
  });
});
