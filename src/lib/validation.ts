// 🔒 src/lib/validation.ts - Server-Side Input Validation with Zod
// Prevents XSS, injection attacks, and malformed data

import { z } from "zod";
import { QUOTE_SERVICE_TITLES } from "./quote-pricing";

// 🔒 Sanitize strings: remove dangerous characters, trim whitespace
const sanitizedString = (minLength = 1, maxLength = 500) =>
  z
    .string()
    .min(minLength, "This field is required")
    .max(maxLength, `Maximum ${maxLength} characters allowed`)
    .transform((val) => val.trim())
    .transform((val) => val.replace(/<[^>]*>/g, "").replace(/[<>]/g, ""));

// 🔒 Email validation with lowercase normalization
const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .max(254, "Email is too long")
  .transform((val) => val.toLowerCase().trim());

// 🔒 Phone validation (North American format with flexibility)
const phoneSchema = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(20, "Phone number is too long")
  .regex(/^[\d\s()+\-\.]+$/, "Please enter a valid phone number")
  .transform((val) => {
    const hasPlus = val.startsWith("+");
    const digits = val.replace(/\D/g, "");
    return hasPlus ? `+${digits}` : digits;
  });

// 🔒 Address validation
const addressSchema = sanitizedString(5, 500);

// 🔒 Service type validation
const serviceSchema = sanitizedString(2, 200);

// 🔒 Price validation (non-negative number)
const priceSchema = z
  .number()
  .min(0, "Price cannot be negative")
  .max(1000000, "Price exceeds maximum allowed")
  .transform((val) => Math.round(val * 100) / 100);

// 🔒 Percentage validation (0-100) - EXPLICITLY ALLOWS 0
const percentageSchema = z
  .number()
  .min(0, "Percentage cannot be negative")
  .max(100, "Percentage cannot exceed 100")
  .transform((val) => Math.round(val * 100) / 100);

// 🔒 Line item validation (one row of an invoice)
export const LineItemSchema = z.object({
  description: sanitizedString(1, 200),
  quantity: z
    .number()
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity exceeds maximum allowed")
    .transform((val) => Math.round(val)),
  unitPrice: priceSchema,
});

// 🔒 Invoice notes validation (optional, sanitized)
const notesSchema = z
  .string()
  .max(2000, "Notes cannot exceed 2000 characters")
  .optional()
  .transform(
    (val) =>
      val
        ?.trim()
        .replace(/<[^>]*>/g, "")
        .replace(/[<>]/g, "") || "",
  );

// 🔒 Valid job statuses (FSM states)
const JOB_STATUSES = [
  "LEAD_RECEIVED",
  "QUOTE_SENT",
  "SCHEDULED",
  "COMPLETED", // ✅ ADDED
  "INVOICED",
  "PAID",
  "UNPAID",
  "LOST",
  "CANCELLED",
] as const;

const jobStatusSchema = z.enum(JOB_STATUSES, {
  message: "Invalid job status",
});

// 🔒 Payment method for manually-recorded (non-Stripe) payments
const PAYMENT_METHODS = ["etransfer", "cash", "card"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
const paymentMethodSchema = z.enum(PAYMENT_METHODS, {
  message: "Invalid payment method",
});

export function validatePaymentMethod(method: string): PaymentMethod {
  return paymentMethodSchema.parse(method);
}

// 🔒 Firestore document ID validation
const firestoreIdSchema = z
  .string()
  .min(1, "ID is required")
  .max(128, "Invalid ID format")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid ID format");

// ============================================
// 🔒 MAIN SCHEMAS FOR SERVER ACTIONS
// ============================================

/**
 * 🔒 Quote submission schema (public-facing form)
 */
export const QuoteSchema = z.object({
  name: sanitizedString(2, 100),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  service: serviceSchema,
  // Customer's requested timing — optional, non-binding. Admin confirms the
  // actual booking. preferredDate is a "YYYY-MM-DD" string from a date input.
  preferredDate: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v ?? "").trim()),
  preferredWindow: z.enum(["", "Morning", "Afternoon", "Evening"]).optional(),
  // Free-text "anything else" — stored as its own field, not jammed into the
  // service string. HTML-stripped, up to 500 chars.
  details: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .transform((v) =>
      (v ?? "")
        .trim()
        .replace(/<[^>]*>/g, "")
        .replace(/[<>]/g, ""),
    ),
  // Campaign attribution (optional). promoCode is validated against the promo
  // table server-side; source is a free-form short tag.
  promoCode: z
    .string()
    .max(20)
    .optional()
    .transform((v) => (v ?? "").trim()),
  source: z
    .string()
    .max(20)
    .optional()
    .transform((v) => (v ?? "").trim()),
});

/**
 * 🔒 Job update schema (admin panel updates)
 */
export const JobUpdateSchema = z
  .object({
    price: priceSchema.optional(),
    discount: priceSchema.optional(),
    taxRate: percentageSchema.optional(), // ✅ Now allows 0
    invoiceNotes: notesSchema,
    lineItems: z
      .array(LineItemSchema)
      .max(50, "Too many line items")
      .optional(),
    // Display-only included-item descriptions for the "one price + list" invoice
    // mode. Presentational only — never affects totals.
    invoiceItems: z
      .array(sanitizedString(1, 200))
      .max(50, "Too many items")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

/**
 * 🔒 Client creation/update schema
 */
export const ClientSchema = z.object({
  name: sanitizedString(2, 100),
  email: emailSchema,
  phone: phoneSchema,
  address: addressSchema,
  propertyNotes: notesSchema,
});

/**
 * 🔒 Service catalog item schema
 */
export const ServiceSchema = z.object({
  name: sanitizedString(1, 100).refine((val) => val.length > 0, {
    message: "This field is required",
  }),
  description: notesSchema,
  unitPrice: priceSchema,
});

const QuotePriceRangeSchema = z
  .object({
    title: z.enum(QUOTE_SERVICE_TITLES),
    low: priceSchema,
    high: priceSchema,
  })
  .refine((range) => range.high >= range.low, {
    message: "Maximum price must be greater than or equal to minimum price",
    path: ["high"],
  });

export const QuotePricingSchema = z
  .array(QuotePriceRangeSchema)
  .length(
    QUOTE_SERVICE_TITLES.length,
    `Exactly ${QUOTE_SERVICE_TITLES.length} quote services are required`,
  )
  .superRefine((ranges, context) => {
    const titles = new Set(ranges.map((range) => range.title));
    if (titles.size !== QUOTE_SERVICE_TITLES.length) {
      context.addIssue({
        code: "custom",
        message: "Each quote service must appear exactly once",
      });
    }
  });

/**
 * 🔒 Quick invoice creation schema
 */
export const InvoiceCreateSchema = z.object({
  lineItems: z
    .array(LineItemSchema)
    .min(1, "At least one line item is required")
    .max(50, "Too many line items"),
  discount: priceSchema.optional(),
  taxRate: percentageSchema.optional(),
  invoiceNotes: notesSchema,
});

/**
 * 🔒 Job status update schema
 */
export const JobStatusSchema = z.object({
  jobId: firestoreIdSchema,
  newStatus: jobStatusSchema,
});

/**
 * 🔒 Booking confirmation schema
 */
export const BookingSchema = z.object({
  jobId: firestoreIdSchema,
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid date format",
    }),
});

/**
 * 🔒 Simple ID schema for single-parameter actions
 */
export const IdSchema = z.object({
  id: firestoreIdSchema,
});

// ============================================
// 🔒 TYPE EXPORTS
// ============================================

export type QuoteInput = z.infer<typeof QuoteSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type ClientInput = z.infer<typeof ClientSchema>;
export type ServiceInput = z.infer<typeof ServiceSchema>;
export type QuotePricingInput = z.infer<typeof QuotePricingSchema>;
export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;
export type JobStatusInput = z.infer<typeof JobStatusSchema>;
export type BookingInput = z.infer<typeof BookingSchema>;

// ============================================
// 🔒 VALIDATION HELPER FUNCTIONS
// ============================================

export function validateQuote(data: unknown): QuoteInput {
  return QuoteSchema.parse(data);
}

export function validateJobUpdate(data: unknown): JobUpdateInput {
  return JobUpdateSchema.parse(data);
}

export function validateClient(data: unknown): ClientInput {
  return ClientSchema.parse(data);
}

export function validateService(data: unknown): ServiceInput {
  return ServiceSchema.parse(data);
}

export function validateQuotePricing(data: unknown): QuotePricingInput {
  return QuotePricingSchema.parse(data);
}

export function validateInvoiceCreate(data: unknown): InvoiceCreateInput {
  return InvoiceCreateSchema.parse(data);
}

export function validateJobStatus(
  jobId: string,
  newStatus: string,
): JobStatusInput {
  return JobStatusSchema.parse({ jobId, newStatus });
}

export function validateBooking(jobId: string, date: string): BookingInput {
  return BookingSchema.parse({ jobId, date });
}

export function validateId(id: string): string {
  return IdSchema.parse({ id }).id;
}
