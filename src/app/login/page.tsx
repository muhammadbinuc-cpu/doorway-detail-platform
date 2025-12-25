"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, Shield } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 1. THE AUTOMATIC REDIRECT LISTENER
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("✅ User detected. Redirecting to Admin...");
                router.push("/admin"); // This matches your folder structure
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // The useEffect above handles the redirect now.
        } catch (err: any) {
            console.error("Login Failed:", err.code);
            if (err.code === 'auth/invalid-credential') {
                setError("Wrong email or password. Please check Firebase Console.");
            } else {
                setError("Login failed. Try again.");
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-xl">
                <div className="flex justify-center mb-6 text-[#D4AF37]">
                    <Shield size={40} />
                </div>
                <h1 className="text-2xl font-bold text-white text-center mb-2">Staff Access</h1>
                <p className="text-gray-400 text-center mb-8 text-sm">Enter your credentials to manage jobs.</p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input
                            type="email"
                            placeholder="admin@doorwaydetail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-black/50 border border-white/10 text-white p-4 rounded-xl focus:border-[#D4AF37] outline-none"
                            required
                        />
                    </div>
                    <div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}