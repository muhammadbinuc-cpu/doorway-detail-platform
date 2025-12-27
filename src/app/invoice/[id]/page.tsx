"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { Loader2, Download, Printer } from "lucide-react";

interface JobData {
    name: string;
    service: string;
    address: string;
    phone: string;
    email?: string;
    price?: number;
    discount?: number;
    taxRate?: number;
    invoiceNotes?: string;
    createdAt: any;
}

export default function InvoicePage() {
    const params = useParams();
    const jobId = params.id as string;
    const [job, setJob] = useState<JobData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const jobDoc = await getDoc(doc(db, "jobs", jobId));
                if (jobDoc.exists()) {
                    setJob(jobDoc.data() as JobData);
                }
            } catch (error) {
                console.error("Error fetching job:", error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId) {
            fetchJob();
        }
    }, [jobId]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
            </div>
        );
    }

    if (!job) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h1>
                    <p className="text-gray-600">The requested invoice does not exist.</p>
                </div>
            </div>
        );
    }

    const invoiceDate = job.createdAt?.seconds
        ? new Date(job.createdAt.seconds * 1000).toLocaleDateString()
        : new Date().toLocaleDateString();

    const subtotal = job.price || 0;
    const discount = job.discount || 0;
    const taxRate = job.taxRate !== undefined ? job.taxRate : 13;
    const taxableAmount = subtotal - discount;
    const tax = taxableAmount * (taxRate / 100);
    const total = taxableAmount + tax;

    const emailSubject = encodeURIComponent(`Invoice from Doorway Detail: ${job.service}`);
    const emailBody = encodeURIComponent(`Hi ${job.name},\n\nHere is your invoice for the recent ${job.service} service.\n\nTotal Due: $${total.toFixed(2)}\n\nYou can view and print your invoice here: ${typeof window !== 'undefined' ? window.location.href : ''}\n\nThank you for your business!\n\nDoorway Detail`);

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans">
            <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-2xl overflow-hidden">
                {/* Actions Toolbar */}
                <div className="bg-black p-4 flex justify-end gap-4 print:hidden">
                    {job.email && (
                        <a
                            href={`mailto:${job.email}?subject=${emailSubject}&body=${emailBody}`}
                            className="bg-white text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
                        >
                            📧 Email to Client
                        </a>
                    )}
                    <button
                        onClick={handlePrint}
                        className="bg-[#D4AF37] text-black px-6 py-2 rounded-lg font-bold hover:bg-[#b5952f] transition-all flex items-center gap-2"
                    >
                        <Printer size={18} /> Print Invoice
                    </button>
                </div>

                {/* Invoice Content */}
                <div className="p-12">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-gray-200">
                        <div>
                            <h1 className="text-4xl font-black italic text-black mb-2">
                                DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
                            </h1>
                            <p className="text-gray-600 text-sm">Detail Done Flawlessly</p>
                            <p className="text-gray-600 text-sm mt-2">289-772-5757</p>
                            <p className="text-gray-600 text-sm">Doorwaydetail@gmail.com</p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h2>
                            <p className="text-gray-600 text-sm">Invoice #: {jobId.substring(0, 8).toUpperCase()}</p>
                            <p className="text-gray-600 text-sm">Date: {invoiceDate}</p>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="mb-12">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">
                            Bill To:
                        </h3>
                        <div className="bg-gray-50 p-6 rounded-xl">
                            <p className="font-bold text-gray-900 text-lg">{job.name}</p>
                            <p className="text-gray-600 mt-1">{job.address}</p>
                            <p className="text-gray-600">{job.phone}</p>
                            <p className="text-gray-600">{job.email}</p>
                        </div>
                    </div>

                    {/* Service Details */}
                    <div className="mb-12">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-black text-white">
                                    <th className="text-left py-4 px-6 font-bold uppercase text-sm">
                                        Service Description
                                    </th>
                                    <th className="text-right py-4 px-6 font-bold uppercase text-sm">
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="py-6 px-6">
                                        <p className="font-bold text-gray-900">{job.service}</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Professional exterior cleaning service
                                        </p>
                                    </td>
                                    <td className="text-right py-6 px-6 font-bold text-gray-900">
                                        ${subtotal.toFixed(2)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-12">
                        <div className="w-80">
                            <div className="flex justify-between py-3 border-b border-gray-200">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="font-bold text-gray-900">${subtotal.toFixed(2)}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex justify-between py-3 border-b border-gray-200 text-red-600">
                                    <span className="font-bold">Discount:</span>
                                    <span className="font-bold">-${discount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-3 border-b border-gray-200">
                                <span className="text-gray-600">Tax ({taxRate}%):</span>
                                <span className="font-bold text-gray-900">${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-4 bg-[#D4AF37] px-4 rounded-lg mt-2">
                                <span className="font-bold text-black text-lg">Total Due:</span>
                                <span className="font-bold text-black text-2xl">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t-2 border-gray-200 pt-8 text-center">
                        {job.invoiceNotes && (
                            <p className="text-black font-bold mb-4 whitespace-pre-wrap">{job.invoiceNotes}</p>
                        )}
                        <p className="text-gray-600 text-sm">
                            Thank you for choosing Doorway Detail for your exterior cleaning needs.
                        </p>
                        <p className="text-gray-600 text-sm mt-2">
                            Payment due upon completion. For questions, contact us at 289-772-5757.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
