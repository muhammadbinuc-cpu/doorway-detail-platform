// 🔒 src/lib/env-validator.ts - Environment Variable Validation
// Fail fast: Catch missing/invalid env vars at startup, not runtime

// 🔒 Required server-side environment variables
const REQUIRED_SERVER_VARS = [
  // Firebase Client (Public)
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",

  // Firebase Admin SDK (Server-only)
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_PRIVATE_KEY",

  // Stripe (payment processing)
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",

  // App configuration
  "NEXT_PUBLIC_BASE_URL",
] as const;

// 🔒 Optional but recommended variables
const OPTIONAL_VARS = [
  // Email service — Gmail SMTP is the active sender (see @/lib/server/mailer).
  // GMAIL_APP_PASSWORD is a Google App Password (requires 2FA on the account).
  "GMAIL_USER",
  "GMAIL_APP_PASSWORD",
  // Legacy/optional — Resend is no longer wired up but kept for reference.
  "RESEND_API_KEY",

  // SMS service
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM_NUMBER",

  // Google Calendar integration
  "GOOGLE_CALENDAR_ID",

  // Supabase (audit logging)
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",

  // Business identity — HST/GST number shown on invoices.
  // Use the NEXT_PUBLIC_ variant so it renders on the public (client) invoice page.
  "NEXT_PUBLIC_BUSINESS_HST_NUMBER",

  // Auto-chase: secret that authenticates the Vercel Cron invoice-reminder route
  "CRON_SECRET",
] as const;

interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
}

/**
 * 🔒 Validate environment variable format
 */
function validateFormat(name: string, value: string): string | null {
  // 🔒 Stripe secret key must start with sk_
  if (name === "STRIPE_SECRET_KEY") {
    if (!value.startsWith("sk_test_") && !value.startsWith("sk_live_")) {
      return `${name} must start with 'sk_test_' or 'sk_live_'`;
    }
  }

  // 🔒 Stripe webhook secret must start with whsec_
  if (name === "STRIPE_WEBHOOK_SECRET") {
    if (!value.startsWith("whsec_")) {
      return `${name} must start with 'whsec_'`;
    }
  }

  // 🔒 Firebase private key must look like a PEM key
  if (name === "GOOGLE_PRIVATE_KEY") {
    // Handle escaped newlines in env vars
    const normalizedKey = value.replace(/\\n/g, "\n");
    if (
      !normalizedKey.includes("-----BEGIN") ||
      !normalizedKey.includes("PRIVATE KEY-----")
    ) {
      return `${name} does not appear to be a valid private key`;
    }
  }

  // 🔒 Email format validation for service account emails
  if (name === "GOOGLE_CLIENT_EMAIL") {
    if (!value.includes("@") || !value.includes(".")) {
      return `${name} does not appear to be a valid email`;
    }
  }

  // 🔒 Base URL should be a valid URL
  if (name === "NEXT_PUBLIC_BASE_URL") {
    try {
      new URL(value);
    } catch {
      return `${name} must be a valid URL (e.g., https://example.com)`;
    }
  }

  return null;
}

/**
 * 🔒 Validate all environment variables
 * Returns detailed validation result
 */
export function validateEnv(): ValidationResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  // 🔒 Check required variables
  for (const varName of REQUIRED_SERVER_VARS) {
    const value = process.env[varName];

    if (!value || value.trim() === "") {
      missing.push(varName);
      continue;
    }

    const formatError = validateFormat(varName, value);
    if (formatError) {
      invalid.push(formatError);
    }
  }

  // 🔒 Check optional variables (warn if missing)
  for (const varName of OPTIONAL_VARS) {
    const value = process.env[varName];

    if (!value || value.trim() === "") {
      warnings.push(`${varName} is not set - related feature will be disabled`);
      continue;
    }

    const formatError = validateFormat(varName, value);
    if (formatError) {
      invalid.push(formatError);
    }
  }

  return {
    valid: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    warnings,
  };
}

/**
 * 🔒 Require valid environment or throw error
 * Call this at application startup (e.g., in layout.tsx)
 */
export function requireValidEnv(): void {
  // 🔒 Skip validation during build time (env vars may not be available)
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    // Client-side in production - skip validation
    return;
  }

  const result = validateEnv();

  // 🔒 Log warnings for optional missing variables during local development only.
  if (process.env.NODE_ENV === "development" && result.warnings.length > 0) {
    console.warn("\n⚠️  Environment Variable Warnings:");
    result.warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  // 🔒 Throw error for critical issues
  if (!result.valid) {
    const errorMessages: string[] = [];

    if (result.missing.length > 0) {
      errorMessages.push(
        `Missing required environment variables:\n   ${result.missing.join("\n   ")}`,
      );
    }

    if (result.invalid.length > 0) {
      errorMessages.push(
        `Invalid environment variable formats:\n   ${result.invalid.join("\n   ")}`,
      );
    }

    const fullMessage = `\n🔒 ENVIRONMENT VALIDATION FAILED\n\n${errorMessages.join("\n\n")}\n\nPlease check your .env.local file against .env.example\n`;

    console.error(fullMessage);

    // 🔒 In development, throw to halt startup
    // In production, log but don't crash (some features may still work)
    if (process.env.NODE_ENV !== "production") {
      throw new Error(fullMessage);
    }
  }
}

/**
 * 🔒 Get validated env var or throw
 * Use for env vars that are absolutely required for a function
 */
export function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * 🔒 Get optional env var with fallback
 */
export function getOptionalEnv(name: string, fallback: string = ""): string {
  return process.env[name] || fallback;
}
