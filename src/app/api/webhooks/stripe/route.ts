import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import Stripe from "stripe";

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
    } catch (err: any) {
        console.error(`❌ Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const jobId = session.metadata?.jobId;

        if (jobId) {
            console.log(`💰 Payment Received for Job: ${jobId}`);

            await adminDb.collection("jobs").doc(jobId).update({
                status: "PAID",
                paidAt: Timestamp.now(),
                stripePaymentId: session.payment_intent as string,
                amountPaid: session.amount_total ? session.amount_total / 100 : 0
            });
        } else {
            console.warn("⚠️ Payment received but no Job ID in metadata.");
        }
    }

    return NextResponse.json({ received: true });
}