import "server-only";
import admin from "firebase-admin";

// 1. Setup Service Account
// We clean the key to remove accidental quotes AND fix newlines
const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
const cleanKey = rawKey.replace(/['"]/g, "").replace(/\\n/g, "\n");

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: cleanKey,
};

// 2. Initialize App (Singleton Pattern)
if (!admin.apps.length) {
    // SAFETY CHECK: Log missing keys but DO NOT crash the build.
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error("⚠️ FIREBASE WARNING: Admin keys are missing or invalid.");
        console.error("Debug Info:", {
            hasProject: !!serviceAccount.projectId,
            hasEmail: !!serviceAccount.clientEmail,
            hasKey: !!serviceAccount.privateKey,
            keyLength: serviceAccount.privateKey?.length || 0
        });
    } else {
        try {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin Initialized");
        } catch (error) {
            console.error("❌ Firebase Init Failed (Check your Private Key format):", error);
        }
    }
}

// 3. Export Services (Safe Exports)
// If init failed, these return empty objects so imports don't crash
export const adminDb = admin.apps.length ? admin.firestore() : {} as FirebaseFirestore.Firestore;
export const adminAuth = admin.apps.length ? admin.auth() : {} as admin.auth.Auth;