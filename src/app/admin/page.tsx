"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
    collection, onSnapshot, query, doc, updateDoc, deleteDoc, orderBy, serverTimestamp
} from "firebase/firestore";
import {
    Loader2, CheckCircle, MapPin, Phone, User, LogOut, Calendar, Trash2, FileText, TrendingUp
} from "lucide-react";
// Import Recharts safely
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
    const [mounted, setMounted] = useState(false); // <--- FIX FOR VERCEL BUILD
    const router = useRouter();

    useEffect(() => {
        setMounted(true); // Only allow charts after mount
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"));
                onSnapshot(q, (snap) => {
                    setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
                    setLoading(false);
                });
            } else { router.push("/login"); }
        });
        return () => unsubscribe();
    }, [router]);

    // CALCULATE METRICS
    const totalRevenue = jobs.reduce((acc, job) => acc + (job.status === 'COMPLETED' ? (job.price || 0) : 0), 0);
    const potentialRevenue = jobs.reduce((acc, job) => acc + (job.price || 0), 0);
    const activeJobs = jobs.filter(j => j.status !== 'COMPLETED').length;

    const chartData = [
        { name: 'Leads', amount: jobs.filter(j => j.status === 'LEAD_RECEIVED').length * 150 }, // Est value
        { name: 'Scheduled', amount: jobs.filter(j => j.status === 'SCHEDULED').reduce((acc, j) => acc + (j.price || 0), 0) },
        { name: 'Completed', amount: totalRevenue },
    ];

    const handleDelete = async (id: string) => {
        if (confirm("Delete this?")) await deleteDoc(doc(db, "jobs", id));
    };

    const handleStatusUpdate = async (id: string, status: string) => {
        await updateDoc(doc(db, "jobs", id), { status, lastUpdated: serverTimestamp() });
    };

    const handlePrice = async (id: string, val: string) => {
        await updateDoc(doc(db, "jobs", id), { price: parseFloat(val) });
    };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            <aside className="w-full md:w-64 bg-black text-white p-6">
                <h1 className="text-2xl font-black italic mb-8">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
                <div className="space-y-4">
                    <div className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3"><User size={20} /> Dashboard</div>
                </div>
                <button onClick={() => signOut(auth)} className="mt-20 text-gray-400 hover:text-white flex items-center gap-2"><LogOut size={16} /> Sign Out</button>
            </aside>

            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    {/* KPI CARDS */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-400 text-xs font-bold uppercase">Active Jobs</h3>
                            <p className="text-4xl font-black mt-2">{activeJobs}</p>
                        </div>
                        <div className="bg-[#D4AF37] text-black p-6 rounded-2xl shadow-sm">
                            <h3 className="text-black/60 text-xs font-bold uppercase">Total Revenue</h3>
                            <p className="text-4xl font-black mt-2">${totalRevenue.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-gray-400 text-xs font-bold uppercase">Pipeline Value</h3>
                            <p className="text-4xl font-black mt-2 text-blue-600">${potentialRevenue.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* CHART SECTION (Protected by mounted check) */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 h-80">
                        <h3 className="font-bold flex items-center gap-2 mb-4"><TrendingUp size={16} /> Revenue Overview</h3>
                        {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 2 ? '#D4AF37' : '#e5e7eb'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl"></div>}
                    </div>

                    {/* JOB LIST */}
                    <div className="grid gap-6">
                        {jobs.map((job) => (
                            <div key={job.id} className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-2 flex-1">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-xl font-bold">{job.name || 'Unknown'}</h3>
                                        <span className={`px-2 py-1 text-xs font-bold rounded ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{job.status}</span>
                                    </div>
                                    <div className="text-sm text-gray-500 flex gap-4">
                                        <span className="flex items-center gap-1"><MapPin size={14} /> {job.address}</span>
                                        <span className="flex items-center gap-1"><Phone size={14} /> {job.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded w-fit">
                                        <span className="font-bold text-gray-400">$</span>
                                        <input type="number" defaultValue={job.price} onBlur={(e) => handlePrice(job.id, e.target.value)} className="bg-transparent font-bold w-20 outline-none" />
                                        {job.price && <a href={`/invoice/${job.id}`} target="_blank" className="text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:underline"><FileText size={12} /> Invoice</a>}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 justify-center border-l pl-6">
                                    {job.status === 'LEAD_RECEIVED' && <button onClick={() => handleStatusUpdate(job.id, 'SCHEDULED')} className="bg-black text-white px-4 py-2 rounded-lg font-bold text-sm">Schedule</button>}
                                    {job.status === 'SCHEDULED' && <button onClick={() => handleStatusUpdate(job.id, 'COMPLETED')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Complete</button>}
                                    <button onClick={() => handleDelete(job.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2"><Trash2 size={14} /> Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}