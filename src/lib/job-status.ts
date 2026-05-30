// src/lib/job-status.ts — Human-friendly labels + colors for job statuses.
// Shared so the dashboard, invoices view, and client profile never render raw
// enum strings like "LEAD_RECEIVED".

export type JobStatus =
    | "LEAD_RECEIVED"
    | "SCHEDULED"
    | "COMPLETED"
    | "INVOICED"
    | "PAID"
    | "UNPAID"
    | "LOST"
    | "CANCELLED";

export interface StatusMeta {
    label: string;
    // Tailwind classes for a pill/badge (bg + text).
    pill: string;
    // Tailwind class for a small status dot (bg only).
    dot: string;
}

export const STATUS_META: Record<JobStatus, StatusMeta> = {
    LEAD_RECEIVED: { label: "New Lead", pill: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
    SCHEDULED: { label: "Scheduled", pill: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    COMPLETED: { label: "Completed", pill: "bg-teal-100 text-teal-700", dot: "bg-teal-500" },
    INVOICED: { label: "Invoiced", pill: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
    PAID: { label: "Paid", pill: "bg-green-100 text-green-700", dot: "bg-green-500" },
    UNPAID: { label: "Unpaid", pill: "bg-red-100 text-red-700", dot: "bg-red-500" },
    LOST: { label: "Lost", pill: "bg-gray-200 text-gray-600", dot: "bg-gray-400" },
    CANCELLED: { label: "Cancelled", pill: "bg-gray-200 text-gray-600", dot: "bg-gray-400" },
};

const FALLBACK: StatusMeta = { label: "Unknown", pill: "bg-gray-100 text-gray-500", dot: "bg-gray-300" };

export function statusMeta(status: string): StatusMeta {
    return STATUS_META[status as JobStatus] ?? FALLBACK;
}

export function statusLabel(status: string): string {
    return statusMeta(status).label;
}
