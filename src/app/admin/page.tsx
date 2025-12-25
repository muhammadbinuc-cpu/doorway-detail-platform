"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, CheckCircle, Clock, MapPin, Phone, User, LogOut, Calendar } from "lucide-react";

interface Job {
    id: string;
    name: string;
    service: string;
    address: string;
    phone: string;
    status: 'LEAD_RECEIVED' | 'SCHEDULED' | 'COMPLETED';
    createdAt: any;
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
                const q = query(collection(db, "jobs"));
                const unsubscribeJobs = onSnapshot(q, (snapshot) => {
                    const jobsData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    })) as Job[];
                    setJobs(jobsData);
                    setLoading(false);
                });
                return () => unsubscribeJobs();
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [router]);

    // THE FSM LOGIC (Finite State Machine)
    const handleStatusUpdate = async (jobId: string, newStatus: string) => {
        setProcessingId(jobId);
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, {
                status: newStatus,
                lastUpdated: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating job:", error);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-[#D4AF37]"><Loader2 className="animate-spin" size={48} /></div>;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-black text-white p-6 flex-shrink-0 flex flex-col justify-between">
                <div>
                    <h1 className="text-2xl font-black italic mb-8">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
                    <nav className="space-y-2">
                        <div className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3">
                            <User size={20} /> Dashboard
                        </div>
                    </nav>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mt-auto pt-8">
                    <LogOut size={16} /> Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Mission Control</h2>
                            <p className="text-gray-500">Managing {jobs.length} active jobs</p>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-4 flex-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-bold text-gray-900">{job.name || 'Unknown Client'}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${job.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                    job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {job.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2"><MapPin size={16} className="text-[#D4AF37]" /> {job.address}</div>
                                            <div className="flex items-center gap-2"><Phone size={16} className="text-[#D4AF37]" /> {job.phone}</div>
                                            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-[#D4AF37]" /> {job.service}</div>
                                            <div className="flex items-center gap-2"><Clock size={16} className="text-gray-400" /> {job.createdAt ? 'Recently Added' : 'No Date'}</div>
                                        </div>
                                    </div>

                                    {/* FSM ACTION BUTTONS */}
                                    <div className="flex flex-col gap-2 justify-center border-l pl-6 border-gray-100">
                                        {job.status === 'LEAD_RECEIVED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(job.id, 'SCHEDULED')}
                                                disabled={!!processingId}
                                                className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2"
                                            >
                                                <Calendar size={18} /> Schedule Job
                                            </button>
                                        )}
                                        {job.status === 'SCHEDULED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(job.id, 'COMPLETED')}
                                                disabled={!!processingId}
                                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle size={18} /> Mark Complete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}