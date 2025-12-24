"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { Loader2, CheckCircle, Clock, MapPin, Phone, User } from "lucide-react";

interface Job {
    id: string;
    name: string;
    service: string;
    address: string;
    phone: string;
    status: 'LEAD_RECEIVED' | 'SCHEDULED';
    createdAt: any;
}

export default function AdminPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        // Real-time listener
        const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const jobsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Job[];

            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (jobId: string) => {
        setProcessingId(jobId);
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, {
                status: "SCHEDULED"
            });
            // No need to manually update state, onSnapshot handles it
        } catch (error) {
            console.error("Error updating job:", error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
            {/* Sidebar / Header */}
            <aside className="w-full md:w-64 bg-black text-white p-6 flex-shrink-0">
                <h1 className="text-xl font-bold border-b border-gray-800 pb-4 mb-6">
                    Doorway <span className="text-[#D4AF37]">Detail</span>
                    <div className="text-xs text-gray-400 font-normal mt-1">Admin Control</div>
                </h1>
                <nav className="space-y-4">
                    <div className="bg-gray-900 text-[#D4AF37] px-4 py-3 rounded-xl font-medium flex items-center gap-3">
                        <User size={20} />
                        <span>Dashboard</span>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900">Incoming Quotes</h2>
                        <div className="text-sm text-gray-500">
                            Live updates active
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#D4AF37]" />
                            <p>Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center border border-gray-200 shadow-sm">
                            <p className="text-gray-500 text-lg">No quotes received yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {jobs.map((job) => (
                                <div key={job.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                                        {/* Job Info */}
                                        <div className="space-y-3 flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900">{job.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${job.status === 'SCHEDULED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {job.status === 'SCHEDULED' ? 'Scheduled' : 'Lead Received'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-black bg-gray-100 px-2 py-0.5 rounded text-xs uppercase">{job.service}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={16} className="text-[#D4AF37]" />
                                                    {job.address}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={16} className="text-[#D4AF37]" />
                                                    <a href={`tel:${job.phone}`} className="hover:underline">{job.phone}</a>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock size={16} className="text-gray-400" />
                                                    {/* Handle possible missing dates safely */}
                                                    {job.createdAt?.seconds
                                                        ? new Date(job.createdAt.seconds * 1000).toLocaleString()
                                                        : 'Just now'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div>
                                            {job.status !== 'SCHEDULED' && (
                                                <button
                                                    onClick={() => handleApprove(job.id)}
                                                    disabled={!!processingId}
                                                    className="group flex items-center gap-2 bg-black text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {processingId === job.id ? (
                                                        <Loader2 size={18} className="animate-spin" />
                                                    ) : (
                                                        <CheckCircle size={18} />
                                                    )}
                                                    {processingId === job.id ? 'Updating...' : 'Approve & Schedule'}
                                                </button>
                                            )}
                                            {job.status === 'SCHEDULED' && (
                                                <div className="flex items-center gap-2 text-green-600 font-bold px-5 py-3">
                                                    <CheckCircle size={20} />
                                                    <span>Action Complete</span>
                                                </div>
                                            )}
                                        </div>
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
