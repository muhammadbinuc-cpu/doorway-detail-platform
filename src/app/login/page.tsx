"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shield, Mail, Lock } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase"; // Your client SDK
import { verifyFirebaseLogin } from "../actions"; // The new secure server action

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
            // 1. Log in with Firebase Client SDK
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Get the ID Token (The proof of identity)
            const idToken = await user.getIdToken();

            // 3. Send Token to Server for Verification
            const result = await verifyFirebaseLogin(idToken);

            if (result.success) {
                router.push("/admin");
                router.refresh();
            } else {
                setError("❌ Server Verification Failed");
            }
        } catch (e: any) {
            console.error("Login Failed:", e);
            if (e.code === 'auth/invalid-credential') {
                setError("❌ Incorrect email or password");
            } else {
                setError("❌ Login failed: " + e.message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md relative z-10">
                <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#D4AF37] to-[#b8941f] rounded-2xl mb-4 shadow-lg shadow-[#D4AF37]/20">
                            <Shield className="text-black" size={36} />
                        </div>
                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                            DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">Admin Portal</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-6 text-center">
                            <span className="font-bold text-sm">{error}</span>
                        </div>
                    )}

                    <div className="space-y-5">
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
                            />
                        </div>

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
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !email || !password}
                            className="w-full bg-gradient-to-r from-[#D4AF37] to-[#b8941f] text-black p-4 rounded-xl font-black text-lg hover:shadow-lg hover:shadow-[#D4AF37]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" size={22} /> : "Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}