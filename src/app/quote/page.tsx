"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, ChevronRight, ChevronLeft, MapPin, Phone, Mail, User, Sparkles } from "lucide-react";
import Link from "next/link";

export default function QuotePage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
        service: "Window Cleaning"
    });

    const services = [
        "Window Cleaning",
        "Gutter Cleaning",
        "Weed Removal",
        "Full Exterior Package"
    ];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, "jobs"), {
                ...formData,
                status: "LEAD_RECEIVED",
                createdAt: serverTimestamp()
            });

            setSuccess(true);
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } catch (error) {
            console.error("Error submitting quote:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-[#D4AF37]/10 p-8 rounded-full mb-6 animate-bounce">
                    <CheckCircle className="w-20 h-20 text-[#D4AF37]" />
                </div>
                <h1 className="text-4xl font-bold text-white mb-4">Quote Received!</h1>
                <p className="text-gray-400 text-lg max-w-md">
                    Thank you, {formData.name}. We have received your details and will be in touch shortly.
                </p>
                <p className="text-sm text-gray-500 mt-8">Redirecting to home...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Header */}
            <nav className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <Link href="/" className="text-xl font-bold italic">
                    Doorway <span className="text-[#D4AF37]">Detail</span>
                </Link>
                <div className="text-sm text-gray-400">
                    Step <span className="text-[#D4AF37] font-bold">{step}</span> of 2
                </div>
            </nav>

            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Progress Bar */}
                    <div className="w-full bg-zinc-900 h-1.5 mb-12 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#D4AF37] transition-all duration-500 ease-out"
                            style={{ width: step === 1 ? '50%' : '100%' }}
                        ></div>
                    </div>

                    <form onSubmit={step === 1 ? handleNext : handleSubmit} className="space-y-8 animate-fade-in-up">

                        {/* Step 1: Personal Info */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">Let's get started</h2>
                                    <p className="text-gray-400">Tell us a bit about yourself.</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                placeholder="John Doe"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                    placeholder="john@example.com"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">Phone Number</label>
                                            <div className="relative">
                                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                    placeholder="(555) 123-4567"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mt-8"
                                >
                                    Next Step <ChevronRight size={20} />
                                </button>
                            </div>
                        )}

                        {/* Step 2: Service Info */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold mb-2">Service Details</h2>
                                    <p className="text-gray-400">Where do you need us?</p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">Service Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D4AF37] transition-colors"
                                                placeholder="123 Example Street, City"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2 pl-1">Service Type</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {services.map((s) => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, service: s })}
                                                    className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${formData.service === s
                                                            ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-bold'
                                                            : 'bg-zinc-900 border-zinc-800 text-gray-400 hover:border-gray-600'
                                                        }`}
                                                >
                                                    <Sparkles size={18} className={formData.service === s ? "text-black" : "text-[#D4AF37]"} />
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="w-1/3 bg-zinc-800 text-white font-bold py-4 rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={20} /> Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 bg-[#D4AF37] text-black font-bold py-4 rounded-xl hover:bg-[#b5952f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : "Submit Quote Request"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    );
}
