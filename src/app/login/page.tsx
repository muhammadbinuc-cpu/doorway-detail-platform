"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";
// ✅ CHANGED: Using secure Email/Password auth
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const password = formData.get("password") as string;
        // 👻 The "Ghost" Email - Hardcoded because only the password matters for the user
        const email = "admin@doorway.com";

        try {
            // Direct Firebase Login
            // This is SECURE. It only works if the password matches the one in Firebase.
            await signInWithEmailAndPassword(auth, email, password);

            // Success!
            router.push("/admin");
        } catch (e: any) {
            console.error("Login Failed:", e);

            // Handle specific Firebase errors
            if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
                setError("❌ Access Denied: Wrong Password");
            } else {
                setError("❌ Login Error: " + e.message);
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                <div className="flex justify-center mb-6 text-[#D4AF37]">
                    <Shield size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h1>
                <p className="text-gray-400 text-center mb-8 text-sm">Enter the secret password.</p>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="w-full bg-black/50 border border-white/10 text-white p-4 rounded-xl focus:border-[#D4AF37] outline-none"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#D4AF37] text-black font-bold p-4 rounded-xl hover:bg-white transition-colors flex justify-center"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Unlock Dashboard"}
                    </button>
                </form>
            </div>
        </div>
    );
}