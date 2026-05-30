import { computeInvoiceTotals, normalizeLineItems, getDueDate, isOverdue, isReminderDue } from "../src/lib/invoice";
import { PAYMENT_TERMS_DAYS } from "../src/lib/business";

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

describe("Invoice totals", () => {
    test("falls back to a single line from service + price when no lineItems", () => {
        const totals = computeInvoiceTotals({ service: "Window Cleaning", price: 200 });
        expect(totals.lineItems).toHaveLength(1);
        expect(totals.lineItems[0]).toEqual({ description: "Window Cleaning", quantity: 1, unitPrice: 200 });
        expect(totals.subtotal).toBe(200);
        expect(totals.total).toBe(200);
    });

    test("uses a default description when service is missing", () => {
        const items = normalizeLineItems({ price: 50 });
        expect(items[0].description).toBe("Cleaning Service");
    });

    test("sums multiple line items with quantities", () => {
        const totals = computeInvoiceTotals({
            lineItems: [
                { description: "Windows", quantity: 2, unitPrice: 100 },
                { description: "Gutters", quantity: 1, unitPrice: 150 },
            ],
        });
        expect(totals.subtotal).toBe(350);
        expect(totals.total).toBe(350);
    });

    test("applies discount before tax", () => {
        const totals = computeInvoiceTotals({ price: 200, discount: 50, taxRate: 13 });
        // (200 - 50) = 150, tax 13% = 19.5, total 169.5
        expect(totals.subtotal).toBe(200);
        expect(totals.discount).toBe(50);
        expect(totals.taxAmount).toBe(19.5);
        expect(totals.total).toBe(169.5);
    });

    test("handles zero tax", () => {
        const totals = computeInvoiceTotals({ price: 100, taxRate: 0 });
        expect(totals.taxAmount).toBe(0);
        expect(totals.total).toBe(100);
    });

    test("rounds to cents", () => {
        const totals = computeInvoiceTotals({ price: 99.99, taxRate: 13 });
        // 99.99 * 0.13 = 12.9987 -> 13.00; total 112.99
        expect(totals.taxAmount).toBe(13);
        expect(totals.total).toBe(112.99);
    });

    test("ignores line items with non-positive quantity, keeping valid ones", () => {
        const totals = computeInvoiceTotals({
            lineItems: [
                { description: "Valid", quantity: 1, unitPrice: 100 },
                { description: "Empty", quantity: 0, unitPrice: 999 },
            ],
        });
        expect(totals.lineItems).toHaveLength(1);
        expect(totals.subtotal).toBe(100);
    });

    test("clamps discount so it never exceeds the subtotal", () => {
        const totals = computeInvoiceTotals({ price: 100, discount: 500, taxRate: 13 });
        expect(totals.discount).toBe(100);
        expect(totals.total).toBe(0);
    });
});

describe("getDueDate", () => {
    test("adds the payment terms window to the issue date", () => {
        const issued = new Date("2026-01-01T00:00:00Z");
        const due = getDueDate(issued);
        const expected = new Date(issued);
        expected.setDate(expected.getDate() + PAYMENT_TERMS_DAYS);
        expect(due.getTime()).toBe(expected.getTime());
    });
});

describe("isOverdue", () => {
    test("true when unpaid and past the due date", () => {
        expect(isOverdue({ status: "INVOICED", invoicedAt: daysAgo(PAYMENT_TERMS_DAYS + 1) })).toBe(true);
        expect(isOverdue({ status: "UNPAID", invoicedAt: daysAgo(PAYMENT_TERMS_DAYS + 5) })).toBe(true);
    });
    test("false before the due date", () => {
        expect(isOverdue({ status: "INVOICED", invoicedAt: daysAgo(1) })).toBe(false);
    });
    test("false for paid or non-invoice statuses", () => {
        expect(isOverdue({ status: "PAID", invoicedAt: daysAgo(100) })).toBe(false);
        expect(isOverdue({ status: "SCHEDULED", invoicedAt: daysAgo(100) })).toBe(false);
    });
    test("false when never invoiced", () => {
        expect(isOverdue({ status: "INVOICED", invoicedAt: null })).toBe(false);
    });
});

describe("isReminderDue", () => {
    const overdueAt = () => daysAgo(PAYMENT_TERMS_DAYS + 4);

    test("sends the first reminder for an overdue invoice", () => {
        expect(isReminderDue({ status: "UNPAID", invoicedAt: overdueAt() })).toBe(true);
    });
    test("respects the 3-day gap between reminders", () => {
        expect(isReminderDue({ status: "UNPAID", invoicedAt: overdueAt(), reminderCount: 1, lastReminderAt: daysAgo(1) })).toBe(false);
        expect(isReminderDue({ status: "UNPAID", invoicedAt: overdueAt(), reminderCount: 1, lastReminderAt: daysAgo(4) })).toBe(true);
    });
    test("stops after the reminder cap (3)", () => {
        expect(isReminderDue({ status: "UNPAID", invoicedAt: overdueAt(), reminderCount: 3, lastReminderAt: daysAgo(30) })).toBe(false);
    });
    test("never reminds a non-overdue invoice", () => {
        expect(isReminderDue({ status: "INVOICED", invoicedAt: daysAgo(1) })).toBe(false);
    });
});
