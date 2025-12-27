import "server-only";
import admin from "firebase-admin";

// 1. Setup Service Account
const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY
        ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
        : undefined,
};

// 2. Initialize App (Singleton Pattern for Next.js)
if (!admin.apps.length) {
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        throw new Error("❌ FATAL: Missing Firebase Admin keys in .env.local");
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin Initialized");
}

// 3. Export Services
export const adminDb = admin.firestore();
export const adminAuth = admin.auth();