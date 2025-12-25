"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    collection,
    onSnapshot,
    query,
    doc,
    updateDoc,
    deleteDoc,
    orderBy,
    serverTimestamp
} from "firebase/firestore";
import {
    Loader2,
    CheckCircle,
    Clock,
    MapPin,
    Phone,
    User,
    LogOut,
    Trash2,
    FileText
} from "lucide-react";

interface Job {
    id: string;
    name: string;
    service: string;
    address: string;
    phone: string;
    status: 'LEAD_RECEIVED' | 'SCHEDULED' | 'COMPLETED';
    createdAt: any;
    price?: number;
}

export default function AdminPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
                const unsubscribe = onSnapshot(q, (snapshot) => {
                    setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job)));
                    setLoading(false);
                });
                return () => unsubscribe();
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    // DELETE FUNCTION
    const handleDelete = async (jobId: string) => {
        if (!window.confirm("Delete this lead permanently?")) return;
        try {
            await deleteDoc(doc(db, "jobs", jobId));
        } catch (error) {
            console.error("Error deleting job:", error);
            alert("Failed to delete job");
        }
    };

    // STATUS UPDATE
    const handleStatusUpdate = async (jobId: string, newStatus: string) => {
        setProcessingId(jobId);
        try {
            await updateDoc(doc(db, "jobs", jobId), {
                status: newStatus,
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    // PRICE UPDATE FUNCTION
    const handlePriceUpdate = async (jobId: string, newPrice: string) => {
        const priceValue = parseFloat(newPrice);
        if (isNaN(priceValue) || priceValue <= 0) return;

        try {
            await updateDoc(doc(db, "jobs", jobId), { price: priceValue });
        } catch (error) {
            console.error("Error updating price:", error);
            alert("Failed to update price");
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-black text-[#D4AF37]">
                <Loader2 className="animate-spin" size={48} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-black text-white p-6 flex-shrink-0 flex flex-col">
                <h1 className="text-2xl font-black italic mb-8">
                    DOORWAY <span className="text-[#D4AF37]">DETAIL</span>
                </h1>
                <div className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3">
                    <User size={20} /> Dashboard
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-gray-400 hover:text-white mt-auto pt-8"
                >
                    <LogOut size={16} /> Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8">
                        Mission Control ({jobs.length})
                    </h2>

                    {jobs.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm">
                            <p className="text-gray-500 text-lg">No quotes received yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {jobs.map((job) => (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col md:flex-row gap-6"
                                >
                                    {/* Job Info */}
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-900">
                                                {job.name || 'Unknown'}
                                            </h3>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${job.status === 'COMPLETED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : job.status === 'SCHEDULED'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={16} className="text-[#D4AF37]" />
                                                {job.address}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Phone size={16} className="text-[#D4AF37]" />
                                                <a href={`tel:${job.phone}`} className="hover:underline">
                                                    {job.phone}
                                                </a>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={16} className="text-[#D4AF37]" />
                                                {job.service}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                {job.createdAt?.seconds
                                                    ? new Date(job.createdAt.seconds * 1000).toLocaleString()
                                                    : 'Just now'}
                                            </div>
                                        </div>

                                        {/* PRICE INPUT SECTION */}
                                        <div className="pt-4 border-t border-gray-100 flex items-center gap-4">
                                            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                                <span className="text-gray-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    defaultValue={job.price || ''}
                                                    onBlur={(e) => handlePriceUpdate(job.id, e.target.value)}
                                                    className="bg-transparent outline-none w-24 font-bold text-gray-900"
                                                    step="0.01"
                                                    min="0"
                                                />
                                            </div>
                                            {job.price && job.price > 0 && (
                                                <a
                                                    href={`/invoice/${job.id}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-bold text-[#D4AF37] hover:underline flex items-center gap-1"
                                                >
                                                    <FileText size={14} /> View Invoice
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 md:border-l md:pl-6 border-gray-100 justify-center min-w-[200px]">
                                        {job.status === 'LEAD_RECEIVED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(job.id, 'SCHEDULED')}
                                                disabled={!!processingId}
                                                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
                                            >
                                                {processingId === job.id ? (
                                                    <Loader2 className="animate-spin mx-auto" size={18} />
                                                ) : (
                                                    'Schedule'
                                                )}
                                            </button>
                                        )}
                                        {job.status === 'SCHEDULED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(job.id, 'COMPLETED')}
                                                disabled={!!processingId}
                                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-50"
                                            >
                                                {processingId === job.id ? (
                                                    <Loader2 className="animate-spin mx-auto" size={18} />
                                                ) : (
                                                    'Complete'
                                                )}
                                            </button>
                                        )}

                                        {/* RED DELETE BUTTON */}
                                        <button
                                            onClick={() => handleDelete(job.id)}
                                            className="bg-red-50 text-red-500 px-6 py-3 rounded-xl font-bold hover:bg-red-100 transition-all flex justify-center items-center gap-2"
                                        >
                                            <Trash2 size={18} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
