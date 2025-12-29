// src/lib/fsm_logic.ts

// The "Graph" of allowed moves
export const JOB_WORKFLOW: Record<string, string[]> = {
    'LEAD_RECEIVED': ['SCHEDULED', 'LOST', 'CANCELLED'],
    'SCHEDULED': ['INVOICED', 'CANCELLED'],
    'INVOICED': ['PAID', 'UNPAID'],
    'PAID': [],     
    'LOST': [],     
    'CANCELLED': [] 
};

// The "Judge" function
export function isValidTransition(currentStatus: string, newStatus: string): boolean {
    // 1. Allow "Reset to Scheduled" as a fail-safe override
    if (newStatus === 'SCHEDULED') return true;

    // 2. Check the graph
    const allowedMoves = JOB_WORKFLOW[currentStatus] || [];
    return allowedMoves.includes(newStatus);
}