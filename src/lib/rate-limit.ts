// 🔒 src/lib/rate-limit.ts - In-Memory Rate Limiting
// Protects against spam, DoS attacks, and credential stuffing

import { headers } from 'next/headers';
import { createRateLimitError } from './errors';

interface RateLimitEntry {
    count: number;
    resetAt: number;      // Timestamp when the window resets
    blockedUntil: number; // Timestamp when block expires (0 = not blocked)
}

// 🔒 In-memory store (cleared on server restart)
// For production at scale, consider Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// 🔒 Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupOldEntries(): void {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

    lastCleanup = now;
    for (const [key, entry] of rateLimitStore.entries()) {
        // Remove entries that are no longer blocked and have reset
        if (entry.blockedUntil < now && entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}

// 🔒 Default configurations for different actions
export const RATE_LIMIT_CONFIGS = {
    // Quote submission: 5 per 15 minutes, 1-hour block
    quote: {
        maxRequests: 5,
        windowMs: 15 * 60 * 1000,      // 15 minutes
        blockDurationMs: 60 * 60 * 1000 // 1 hour
    },

    // Login attempts: 5 per 5 minutes, 15-minute block
    login: {
        maxRequests: 5,
        windowMs: 5 * 60 * 1000,       // 5 minutes
        blockDurationMs: 15 * 60 * 1000 // 15 minutes
    },

    // API requests: 30 per minute, 5-minute block
    api: {
        maxRequests: 30,
        windowMs: 60 * 1000,           // 1 minute
        blockDurationMs: 5 * 60 * 1000  // 5 minutes
    }
} as const;

/**
 * 🔒 Get client IP address from request headers
 * Handles various proxy configurations
 */
export async function getClientIP(): Promise<string> {
    const headerList = await headers();

    // Check common proxy headers in order of preference
    const forwardedFor = headerList.get('x-forwarded-for');
    if (forwardedFor) {
        // Take the first IP in the chain (original client)
        return forwardedFor.split(',')[0].trim();
    }

    const realIP = headerList.get('x-real-ip');
    if (realIP) return realIP.trim();

    // Vercel-specific header
    const vercelForwarded = headerList.get('x-vercel-forwarded-for');
    if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

    // Fallback (shouldn't happen in production)
    return 'unknown';
}

/**
 * 🔒 Check rate limit for an action
 * Returns: { allowed: true } or { allowed: false, retryAfterSeconds, error }
 */
export async function checkRateLimit(
    action: keyof typeof RATE_LIMIT_CONFIGS,
    customIdentifier?: string
): Promise<{
    allowed: boolean;
    retryAfterSeconds?: number;
    remaining?: number;
}> {
    cleanupOldEntries();

    const config = RATE_LIMIT_CONFIGS[action];
    const ip = await getClientIP();
    const key = customIdentifier
        ? `${action}:${customIdentifier}`
        : `${action}:${ip}`;

    const now = Date.now();
    let entry = rateLimitStore.get(key);

    // 🔒 Check if currently blocked
    if (entry && entry.blockedUntil > now) {
        const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
        return {
            allowed: false,
            retryAfterSeconds,
            remaining: 0
        };
    }

    // 🔒 Initialize or reset entry if window has passed
    if (!entry || entry.resetAt <= now) {
        entry = {
            count: 0,
            resetAt: now + config.windowMs,
            blockedUntil: 0
        };
    }

    // 🔒 Increment count
    entry.count++;

    // 🔒 Check if limit exceeded
    if (entry.count > config.maxRequests) {
        entry.blockedUntil = now + config.blockDurationMs;
        rateLimitStore.set(key, entry);

        const retryAfterSeconds = Math.ceil(config.blockDurationMs / 1000);
        console.warn(`[RateLimit] Blocked: ${key} for ${retryAfterSeconds}s`);

        return {
            allowed: false,
            retryAfterSeconds,
            remaining: 0
        };
    }

    rateLimitStore.set(key, entry);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.count
    };
}

/**
 * 🔒 Enforce rate limit - throws AppError if exceeded
 * Use in server actions
 */
export async function enforceRateLimit(
    action: keyof typeof RATE_LIMIT_CONFIGS,
    customIdentifier?: string
): Promise<void> {
    const result = await checkRateLimit(action, customIdentifier);

    if (!result.allowed) {
        throw createRateLimitError(result.retryAfterSeconds!);
    }
}

/**
 * 🔒 For API routes: check rate limit and return proper 429 response if exceeded
 * Returns null if allowed, or a Response object if rate limited
 */
export async function rateLimitResponse(
    action: keyof typeof RATE_LIMIT_CONFIGS,
    customIdentifier?: string
): Promise<Response | null> {
    const result = await checkRateLimit(action, customIdentifier);

    if (!result.allowed) {
        return new Response(
            JSON.stringify({
                error: 'Too many requests. Please try again later.',
                retryAfter: result.retryAfterSeconds
            }),
            {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': String(result.retryAfterSeconds),
                    // 🔒 CORS headers for client-side error handling
                    'Access-Control-Allow-Origin': '*'
                }
            }
        );
    }

    return null;
}

/**
 * 🔒 Reset rate limit for a specific identifier
 * Useful for successful login (to clear failed attempts)
 */
export function resetRateLimit(action: string, identifier: string): void {
    const key = `${action}:${identifier}`;
    rateLimitStore.delete(key);
}
