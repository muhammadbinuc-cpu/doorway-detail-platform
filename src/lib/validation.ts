// 🔒 src/lib/validation.ts - Server-Side Input Validation with Zod
// Prevents XSS, injection attacks, and malformed data

import { z } from 'zod';

// 🔒 Sanitize strings: remove dangerous characters, trim whitespace
const sanitizedString = (minLength = 1, maxLength = 500) =>
    z.string()
        .min(minLength, 'This field is required')
        .max(maxLength, `Maximum ${maxLength} characters allowed`)
        .transform((val) => val.trim())
        .transform((val) => val.replace(/<[^>]*>/g, '').replace(/[<>]/g, ''));

// 🔒 Email validation with lowercase normalization
const emailSchema = z.string()
    .email('Please enter a valid email address')
    .max(254, 'Email is too long')
    .transform((val) => val.toLowerCase().trim());

// 🔒 Phone validation (North American format with flexibility)
const phoneSchema = z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .regex(
        /^[\d\s()+\-\.]+$/,
        'Please enter a valid phone number'
    )
    .transform((val) => {
        const hasPlus = val.startsWith('+');
        const digits = val.replace(/\D/g, '');
        return hasPlus ? `+${digits}` : digits;
    });

// 🔒 Address validation
const addressSchema = sanitizedString(5, 500);

// 🔒 Service type validation
const serviceSchema = sanitizedString(2, 200);

// 🔒 Price validation (non-negative number)
const priceSchema = z.number()
    .min(0, 'Price cannot be negative')
    .max(1000000, 'Price exceeds maximum allowed')
    .transform((val) => Math.round(val * 100) / 100);

// 🔒 Percentage validation (0-100) - EXPLICITLY ALLOWS 0
const percentageSchema = z.number()
    .min(0, 'Percentage cannot be negative')
    .max(100, 'Percentage cannot exceed 100')
    .transform((val) => Math.round(val * 100) / 100);

// 🔒 Invoice notes validation (optional, sanitized)
const notesSchema = z.string()
    .max(2000, 'Notes cannot exceed 2000 characters')
    .optional()
    .transform((val) => val?.trim().replace(/<[^>]*>/g, '').replace(/[<>]/g, '') || '');

// 🔒 Valid job statuses (FSM states)
const JOB_STATUSES = [
    'LEAD_RECEIVED',
    'SCHEDULED',
    'COMPLETED',       // ✅ ADDED
    'INVOICED',
    'PAID',
    'UNPAID',
    'LOST',
    'CANCELLED'
] as const;

const jobStatusSchema = z.enum(JOB_STATUSES, {
    message: 'Invalid job status'
});

// 🔒 Firestore document ID validation
const firestoreIdSchema = z.string()
    .min(1, 'ID is required')
    .max(128, 'Invalid ID format')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid ID format');

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
    service: serviceSchema
});

/**
 * 🔒 Job update schema (admin panel updates)
 */
export const JobUpdateSchema = z.object({
    price: priceSchema.optional(),
    discount: priceSchema.optional(),
    taxRate: percentageSchema.optional(),  // ✅ Now allows 0
    invoiceNotes: notesSchema
}).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided' }
);

/**
 * 🔒 Client creation/update schema
 */
export const ClientSchema = z.object({
    name: sanitizedString(2, 100),
    email: emailSchema,
    phone: phoneSchema,
    address: addressSchema,
    propertyNotes: notesSchema
});

/**
 * 🔒 Job status update schema
 */
export const JobStatusSchema = z.object({
    jobId: firestoreIdSchema,
    newStatus: jobStatusSchema
});

/**
 * 🔒 Booking confirmation schema
 */
export const BookingSchema = z.object({
    jobId: firestoreIdSchema,
    date: z.string()
        .min(1, 'Date is required')
        .refine(
            (val) => !isNaN(Date.parse(val)),
            { message: 'Invalid date format' }
        )
});

/**
 * 🔒 Client notes update schema
 */
export const ClientNotesSchema = z.object({
    clientId: firestoreIdSchema,
    notes: notesSchema
});

/**
 * 🔒 Simple ID schema for single-parameter actions
 */
export const IdSchema = z.object({
    id: firestoreIdSchema
});

// ============================================
// 🔒 TYPE EXPORTS
// ============================================

export type QuoteInput = z.infer<typeof QuoteSchema>;
export type JobUpdateInput = z.infer<typeof JobUpdateSchema>;
export type ClientInput = z.infer<typeof ClientSchema>;
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

export function validateJobStatus(jobId: string, newStatus: string): JobStatusInput {
    return JobStatusSchema.parse({ jobId, newStatus });
}

export function validateBooking(jobId: string, date: string): BookingInput {
    return BookingSchema.parse({ jobId, date });
}

export function validateId(id: string): string {
    return IdSchema.parse({ id }).id;
}