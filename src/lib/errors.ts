// 🔒 src/lib/errors.ts - Secure Error Handling
// Prevents exposure of internal details (stack traces, DB structure, etc.)

// 🔒 User-friendly error messages mapped from internal error codes
const ERROR_MESSAGES: Record<string, string> = {
    // Firebase Auth errors
    'auth/invalid-credential': 'Invalid email or password',
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/email-already-in-use': 'This email is already registered',
    'auth/weak-password': 'Password is too weak',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/session-cookie-expired': 'Your session has expired. Please log in again',
    'auth/session-cookie-revoked': 'Your session has been revoked. Please log in again',

    // Firestore errors
    'not-found': 'The requested resource was not found',
    'permission-denied': 'You do not have permission to perform this action',
    'already-exists': 'This resource already exists',
    'resource-exhausted': 'Service temporarily unavailable. Please try again later',
    'invalid-argument': 'Invalid request data',

    // Custom app errors
    'validation-error': 'Please check your input and try again',
    'rate-limited': 'Too many requests. Please wait before trying again',
    'fsm-violation': 'Invalid status transition',
    'unauthorized': 'Access denied. Please log in',

    // Default fallback
    'unknown': 'An unexpected error occurred. Please try again'
};

/**
 * 🔒 Custom application error class
 * - Logs detailed info internally for debugging
 * - Returns user-friendly message externally
 */
export class AppError extends Error {
    public readonly code: string;
    public readonly userMessage: string;
    public readonly isOperational: boolean;

    constructor(
        code: string,
        internalMessage: string,
        userMessage?: string,
        isOperational = true
    ) {
        super(internalMessage);
        this.name = 'AppError';
        this.code = code;
        this.userMessage = userMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown'];
        this.isOperational = isOperational;

        // 🔒 Log detailed error internally (never exposed to client)
        console.error(`[AppError] Code: ${code} | Internal: ${internalMessage}`);

        Error.captureStackTrace?.(this, this.constructor);
    }
}

/**
 * 🔒 Helper to extract error code from various error types
 */
function extractErrorCode(error: unknown): string {
    if (error instanceof AppError) {
        return error.code;
    }
    if (error && typeof error === 'object') {
        if ('code' in error && typeof (error as any).code === 'string') {
            return (error as any).code;
        }
        if ('name' in error) {
            const name = (error as Error).name;
            if (name === 'ZodError') return 'validation-error';
        }
    }
    return 'unknown';
}

/**
 * 🔒 Main error handler for server actions
 * - Logs full error details to console (for debugging)
 * - Returns only user-safe message
 * 
 * Usage:
 * ```
 * try {
 *     // ... action code
 * } catch (error) {
 *     return handleServerActionError(error, 'submitQuote');
 * }
 * ```
 */
export function handleServerActionError(
    error: unknown,
    actionName: string
): { success: false; error: string } {
    const code = extractErrorCode(error);
    const internalMessage = error instanceof Error ? error.message : String(error);

    // 🔒 Internal logging (visible in server logs, NOT sent to client)
    console.error(`[ServerAction:${actionName}] Error Code: ${code}`);
    console.error(`[ServerAction:${actionName}] Internal: ${internalMessage}`);
    if (error instanceof Error && error.stack) {
        console.error(`[ServerAction:${actionName}] Stack:`, error.stack);
    }

    // 🔒 Return only user-friendly message
    const userMessage = error instanceof AppError
        ? error.userMessage
        : (ERROR_MESSAGES[code] || ERROR_MESSAGES['unknown']);

    return { success: false, error: userMessage };
}

/**
 * 🔒 Create an AppError for FSM violations with detailed allowed transitions
 */
export function createFsmError(
    currentStatus: string,
    attemptedStatus: string,
    allowedTransitions: string[]
): AppError {
    const allowed = allowedTransitions.length > 0
        ? allowedTransitions.join(', ')
        : 'none (terminal state)';

    return new AppError(
        'fsm-violation',
        `Invalid FSM transition: ${currentStatus} → ${attemptedStatus}. Allowed: ${allowed}`,
        `Cannot change status from ${currentStatus} to ${attemptedStatus}. Allowed transitions: ${allowed}`
    );
}

/**
 * 🔒 Create an AppError for validation failures
 */
export function createValidationError(details: string): AppError {
    return new AppError(
        'validation-error',
        `Validation failed: ${details}`,
        'Please check your input and try again'
    );
}

/**
 * 🔒 Create an AppError for rate limiting
 */
export function createRateLimitError(retryAfterSeconds: number): AppError {
    return new AppError(
        'rate-limited',
        `Rate limit exceeded. Retry after ${retryAfterSeconds}s`,
        `Too many requests. Please wait ${Math.ceil(retryAfterSeconds / 60)} minute(s) before trying again`
    );
}
