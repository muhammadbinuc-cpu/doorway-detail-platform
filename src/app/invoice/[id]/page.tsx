"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, CreditCard, ShieldCheck } from "lucide-react";
import { createCheckoutSession } from "@/app/actions";

export default function InvoicePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const [job, setJob] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    const paymentSuccess = searchParams.get('success') === 'true';

    useEffect(() => {
        if (!id) return;
        const fetchJob = async () => {
            const snap = await getDoc(doc(db, "jobs", id));
            if (snap.exists()) setJob({ id: snap.id, ...snap.data() });
            setLoading(false);
        };
        fetchJob();
    }, [id]);

    const handlePay = async () => {
        setPaying(true);
        const result = await createCheckoutSession(id);
        if (result.success && result.url) {
            window.location.href = result.url; 
        } else {
            alert("Payment Init Failed: " + result.error);
            setPaying(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="animate-spin text-[#D4AF37]" size={48} /></div>;
    if (!job) return <div className="p-10 text-center">Invoice not found.</div>;

    const price = Number(job.price) || 0;
    const discount = Number(job.discount) || 0;
    const subtotal = price - discount;
    const taxRate = Number(job.taxRate) || 0; 
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    if (job.status === 'PAID' || paymentSuccess) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <div className="bg-white p-10 rounded-3xl max-w-md w-full text-center shadow-2xl animate-scale-up">
                    <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-2 text-black">PAID IN FULL</h1>
                    <p className="text-gray-500 mb-8">Thank you for your business, {job.name}!</p>
                    <div className="bg-gray-100 p-4 rounded-xl flex justify-between font-bold text-lg text-black">
                        <span>Total Paid:</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans text-black">
            <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                <div className="bg-black p-8 text-white text-center">
                    <h1 className="text-2xl font-black italic tracking-wider mb-2">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
                    <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">Official Invoice</p>
                </div>

                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">Billed To</h2>
                            <p className="text-xl font-bold">{job.name}</p>
                            <p className="text-gray-500">{job.address}</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-gray-400 text-xs font-bold uppercase tracking-wide mb-1">Invoice #</h2>
                            <p className="font-mono font-bold text-gray-500">{job.id.slice(0, 6).toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <span className="font-bold">{job.service || "Window Cleaning"}</span>
                            <span className="font-bold">${price.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-green-600 text-sm mb-2">
                                <span>Discount</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-gray-500 text-sm mb-4">
                            <span>Tax ({taxRate}%)</span>
                            <span>${taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-black pt-4 border-t border-gray-200">
                            <span>Total Due</span>
                            <span className="text-[#D4AF37]">${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        onClick={handlePay}
                        disabled={paying}
                        className="w-full bg-black text-white py-5 rounded-xl font-bold text-lg hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {paying ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                        Pay ${total.toFixed(2)}
                    </button>

                    <div className="mt-6 flex items-center justify-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wide">
                        <ShieldCheck size={14} /> Secure Payment Processing
                    </div>
                </div>
            </div>
        </div>
    );
}