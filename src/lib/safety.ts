// src/lib/safety.ts
import { z } from "zod";

// 1. PII Redaction Pattern (The "Privacy Layer")
// Matches emails to replace them with "r***@domain.com"
export function redactPII(text: string): string {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    return text.replace(emailRegex, (email) => {
        const [name, domain] = email.split("@");
        return `${name[0]}***@${domain}`;
    });
}

// 2. Strict JSON Validation (The "Structured Output Layer")
// This ensures the LLM didn't hallucinate a fake tool or bad JSON
export function validateAgentOutput(rawJson: any) {
    const AgentSchema = z.object({
        thought_process: z.string(),
        proposed_action: z.enum(["TOOL_CALL", "RESPONSE", "ERROR"]),
        tool_name: z.enum(["addToGoogleCalendar", "emailInvoice", "none"]).optional(),
        // We use .passthrough() because tool_arguments varies
        tool_arguments: z.object({}).passthrough().optional(), 
        safety_flag: z.boolean()
    });

    const result = AgentSchema.safeParse(rawJson);

    if (!result.success) {
        console.error("🚨 AGENT SAFETY FAILURE:", result.error);
        throw new Error("Safety Layer Blocked: Invalid Agent Output Structure");
    }

    // Double Check: If safety_flag is true, BLOCK IT.
    if (result.data.safety_flag) {
         throw new Error("Safety Layer Blocked: Agent flagged this action as unsafe.");
    }

    return result.data;
}