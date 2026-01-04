"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createSession } from "../actions";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // ✅ TASK 1: Step 1 - Firebase Authentication (client-side)
            await signInWithEmailAndPassword(auth, email, password);

            // ✅ TASK 1: Step 2 - Create server-side session (bridge for middleware)
            const sessionResult = await createSession();

            if (!sessionResult.success) {
                throw new Error("Failed to create session");
            }

            // Step 3: Redirect to admin dashboard
            router.push("/admin");
        } catch (e: any) {
            console.error("Login Failed:", e);

            // Handle specific Firebase auth errors
            switch (e.code) {
                case 'auth/invalid-email':
                    setError("❌ Invalid email address format");
                    break;
                case 'auth/user-not-found':
                    setError("❌ No account found with this email");
                    break;
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    setError("❌ Incorrect password");
                    break;
                case 'auth/too-many-requests':
                    setError("❌ Too many failed attempts. Try again later");
                    break;
                default:
                    setError("❌ Login failed: " + (e.message || "Unknown error"));
            }
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#b8941f] rounded-2xl mb-4 shadow-lg shadow-[#D4AF37]/20">
                            <Shield className="text-black" size={36} />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                            DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">Admin Portal • Secure Access</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-center">
                            <span className="font-bold text-sm">{error}</span>
                        </div>
                    )}

                    {/* Form Inputs */}
                    <div className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-3 ml-1">
                                <Mail size={12} className="inline mr-1" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border-2 border-white/10 text-white p-4 rounded-xl outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium"
                                placeholder="admin@doorway.com"
                                required
                                disabled={loading}
                                autoComplete="email"
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-gray-400 text-xs font-bold uppercase tracking-wide mb-3 ml-1">
                                <Lock size={12} className="inline mr-1" />
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border-2 border-white/10 text-white p-4 rounded-xl outline-none focus:border-[#D4AF37] focus:bg-white/10 transition-all placeholder:text-gray-600 font-medium"
                                placeholder="Enter your password"
                                required
                                disabled={loading}
                                autoComplete="current-password"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] text-black p-4 rounded-xl font-black text-lg hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={22} />
                                    Authenticating...
                                </>
                            ) : (
                                <>
                                    <Shield size={22} />
                                    Access Dashboard
                                </>
                            )}
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-xs font-medium">
                            🔒 Protected by Firebase Authentication
                        </p>
                    </div>
                </form>

                {/* Subtle branding */}
                <p className="text-center text-gray-600 text-xs mt-6">
                    DoorWay Detail © {new Date().getFullYear()} • All Rights Reserved
                </p>
            </div>
        </div>
    );
}