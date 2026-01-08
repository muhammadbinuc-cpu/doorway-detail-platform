import { NextResponse } from "next/server";

// 🔒 TEMPORARY DEBUG ROUTE - DELETE BEFORE PRODUCTION
export async function GET() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const adminSecret = process.env.ADMIN_SECRET;
    const resendKey = process.env.RESEND_API_KEY;

    // Log ONLY first 10 chars (safe partial exposure for debugging)
    console.log("🔍 ENV DEBUG REPORT:");
    console.log("  STRIPE_SECRET_KEY:", stripeKey ? `${stripeKey.slice(0, 10)}...` : "❌ UNDEFINED");
    console.log("  ADMIN_SECRET:", adminSecret ? `${adminSecret.slice(0, 10)}...` : "❌ UNDEFINED");
    console.log("  RESEND_API_KEY:", resendKey ? `${resendKey.slice(0, 10)}...` : "❌ UNDEFINED");
    console.log("  NODE_ENV:", process.env.NODE_ENV);

    return NextResponse.json({
        stripeLoaded: !!stripeKey,
        stripePrefix: stripeKey?.slice(0, 7), // Shows "sk_test" or "sk_live"
        adminSecretLoaded: !!adminSecret,
        resendLoaded: !!resendKey,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
