import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";
import { validateId } from "@/lib/validation";
import { sendPaymentReceipt } from "@/lib/server/payment-receipt";

// --- STRIPE INIT (LAZY LOADING) ---
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!_stripe) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error("STRIPE_SECRET_KEY is undefined");
        _stripe = new Stripe(key, {
            apiVersion: '2025-12-15.clover',
        });
    }
    return _stripe;
}

// 🔒 This secret ensures the request is actually from Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get("stripe-signature");

    let event: Stripe.Event;

    try {
        if (!sig || !endpointSecret) throw new Error("Missing Signature or Secret");
        event = getStripe().webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`❌ Webhook Error: ${message}`);
        return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const rawJobId = session.metadata?.jobId;

        if (session.payment_status !== "paid") {
            return NextResponse.json({ received: true });
        }

        if (rawJobId) {
            let jobId: string;
            try {
                jobId = validateId(rawJobId);
            } catch {
                console.warn("⚠️ Payment received with invalid Job ID metadata.");
                return NextResponse.json({ received: true });
            }

            await adminDb.collection("jobs").doc(jobId).update({
                status: "PAID",
                paidAt: Timestamp.now(),
                paymentMethod: "card",
                stripePaymentId: session.payment_intent as string,
                amountPaid: session.amount_total ? session.amount_total / 100 : 0
            });

            await sendPaymentReceipt(jobId); // non-blocking receipt email
        } else {
            console.warn("⚠️ Payment received but no Job ID in metadata.");
        }
    }

    return NextResponse.json({ received: true });
}
