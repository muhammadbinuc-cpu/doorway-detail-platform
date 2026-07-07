"use client";

interface EmailStatusBadgeProps {
  status?: "sent" | "failed" | string;
  at?: { seconds?: number } | null;
  error?: string;
}

/** Outcome of the last customer email on a job. Renders nothing until a send happens. */
export function EmailStatusBadge({ status, at, error }: EmailStatusBadgeProps) {
  if (status !== "sent" && status !== "failed") return null;
  const when = at?.seconds
    ? new Date(at.seconds * 1000).toLocaleDateString("en-CA", {
        month: "short",
        day: "numeric",
      })
    : "";
  if (status === "sent") {
    return (
      <span className="px-2 py-1 text-xs font-bold text-green-700 bg-green-50 rounded">
        Emailed ✓{when ? ` ${when}` : ""}
      </span>
    );
  }
  return (
    <span
      title={error || undefined}
      className="px-2 py-1 text-xs font-bold text-red-600 bg-red-50 rounded"
    >
      Email failed{when ? ` ${when}` : ""} — resend
    </span>
  );
}
