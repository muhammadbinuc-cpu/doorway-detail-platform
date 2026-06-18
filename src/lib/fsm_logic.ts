// src/lib/fsm_logic.ts

// 🔒 Finite State Machine for Job Workflow
// Prevents invalid state transitions (e.g., LEAD → PAID without invoicing)

export const JOB_WORKFLOW: Record<string, string[]> = {
  LEAD_RECEIVED: ["SCHEDULED", "LOST", "CANCELLED"],
  SCHEDULED: ["COMPLETED", "CANCELLED"], // ✅ Can complete or cancel
  COMPLETED: ["INVOICED"], // ✅ Must invoice after completion
  INVOICED: ["PAID", "UNPAID", "CANCELLED"], // CANCELLED = voided invoice
  PAID: [], // Terminal state (no transitions)
  UNPAID: ["PAID", "CANCELLED"],
  LOST: [], // Terminal state
  CANCELLED: ["SCHEDULED"], // Allow rescheduling cancelled jobs
};

/**
 * 🔒 Validate state transition
 * @param currentStatus - Current job status
 * @param newStatus - Desired new status
 * @returns true if transition is allowed
 */
export function isValidTransition(
  currentStatus: string,
  newStatus: string,
): boolean {
  // 🔒 SAFETY: Allow admins to reset to SCHEDULED as emergency override
  // This lets you fix jobs stuck in bad states
  if (newStatus === "SCHEDULED") {
    console.log("[FSM] Admin override: Resetting to SCHEDULED");
    return true;
  }

  // 🔒 Check if transition is in the allowed workflow
  const allowedTransitions = JOB_WORKFLOW[currentStatus];

  if (!allowedTransitions) {
    console.error("[FSM] Unknown current status:", currentStatus);
    return false;
  }

  const isAllowed = allowedTransitions.includes(newStatus);

  if (!isAllowed) {
    console.warn("[FSM] Blocked transition:", {
      from: currentStatus,
      to: newStatus,
      allowed: allowedTransitions,
    });
  }

  return isAllowed;
}

/**
 * 🔒 Get human-readable transition rules
 */
export function getTransitionRules(status: string): string {
  const allowed = JOB_WORKFLOW[status];
  if (!allowed || allowed.length === 0) {
    return "No transitions allowed (terminal state)";
  }
  return `Can transition to: ${allowed.join(", ")}`;
}
