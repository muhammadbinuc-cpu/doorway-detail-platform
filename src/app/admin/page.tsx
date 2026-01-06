"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, doc, deleteDoc, orderBy, limit } from "firebase/firestore";
import { Loader2, MapPin, Phone, LogOut, Trash2, FileText, TrendingUp, Users, LayoutDashboard, Settings, X, Truck, Repeat, Calendar, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Link from "next/link";
import { confirmBooking, updateJobStatus, emailInvoice, updateJobDetails, sendOnMyWay, createRecurringJob } from "../actions";

interface Job {
    id: string;
    name: string;
    service: string;
    address: string;
    phone: string;
    status: 'LEAD_RECEIVED' | 'SCHEDULED' | 'COMPLETED' | 'INVOICED' | 'PAID';
    createdAt: any;
    price?: number;
    discount?: number;
    taxRate?: number;
    invoiceNotes?: string;
}

// ✅ UPDATED: Full Flexibility
const getNextStatuses = (currentStatus: string): string[] => {
    return ['LEAD_RECEIVED', 'SCHEDULED', 'COMPLETED', 'INVOICED', 'PAID'];
};

export default function AdminPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [editForm, setEditForm] = useState({ discount: 0, taxRate: 13, invoiceNotes: "" });
    const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [schedulingJobId, setSchedulingJobId] = useState<string | null>(null);
    const [scheduleDate, setScheduleDate] = useState("");
    const [syncError, setSyncError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        let unsubscribeSnapshot: (() => void) | null = null;
        const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(50));
                unsubscribeSnapshot = onSnapshot(q, (snap) => {
                    setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as Job)));
                    setLoading(false);
                }, (error) => { if (error.code !== "permission-denied") console.error("Firestore Error:", error); });
            } else { if (unsubscribeSnapshot) unsubscribeSnapshot(); router.push("/login"); }
        });
        return () => { if (unsubscribeSnapshot) unsubscribeSnapshot(); unsubscribeAuth(); };
    }, [router]);

    const totalRevenue = jobs.reduce((acc, job) => acc + (job.status === 'COMPLETED' || job.status === 'PAID' ? (job.price || 0) : 0), 0);
    const potentialRevenue = jobs.reduce((acc, job) => acc + (job.price || 0), 0);
    const activeJobs = jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'PAID').length;
    const chartData = [{ name: 'Leads', amount: jobs.filter(j => j.status === 'LEAD_RECEIVED').length * 150 }, { name: 'Scheduled', amount: jobs.filter(j => j.status === 'SCHEDULED').reduce((acc, j) => acc + (j.price || 0), 0) }, { name: 'Completed', amount: totalRevenue }];

    const handleDelete = async (id: string) => { if (confirm("Delete this job?")) await deleteDoc(doc(db, "jobs", id)); };
    const handleStatusUpdate = async (id: string, status: string) => { const res = await updateJobStatus(id, status); if (!res.success) alert("Error: " + res.error); };
    const handlePrice = async (id: string, val: string) => { await updateJobDetails(id, { price: parseFloat(val) }); };
    const handleSendInvoice = async (id: string) => { if (!confirm("Send Invoice Email?")) return; const res = await emailInvoice(id); if (res.success) alert("✅ Invoice Sent!"); else alert("Error: " + res.error); };
    const handleOnMyWay = async (id: string) => { if (!confirm("Send SMS?")) return; const res = await sendOnMyWay(id); if (res.success) alert("✅ SMS Sent!"); else alert("Error: " + res.error); };
    const handleRecurring = async (id: string) => { if (!confirm("Book again?")) return; const res = await createRecurringJob(id); if (res.success) alert("✅ Job Created!"); else alert("Error: " + res.error); };

    if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            <aside className="w-full md:w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 text-white p-6 flex flex-col">
                <h1 className="text-2xl font-black italic mb-8">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
                <nav className="space-y-2 flex-1"><div className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3"><LayoutDashboard size={20} /> Dashboard</div><Link href="/admin/clients" className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all block"><Users size={20} /> Clients</Link></nav>
                <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors mt-8"><LogOut size={16} /> Sign Out</button>
            </aside>
            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-gray-400 text-xs font-bold uppercase">Active Jobs</h3><p className="text-4xl font-black mt-2">{activeJobs}</p></div>
                        <div className="bg-[#D4AF37] text-black p-6 rounded-2xl shadow-sm"><h3 className="text-black/60 text-xs font-bold uppercase">Total Revenue</h3><p className="text-4xl font-black mt-2">${totalRevenue.toFixed(2)}</p></div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100"><h3 className="text-gray-400 text-xs font-bold uppercase">Pipeline Value</h3><p className="text-4xl font-black mt-2 text-blue-600">${potentialRevenue.toFixed(2)}</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 h-80"><h3 className="font-bold flex items-center gap-2 mb-4"><TrendingUp size={16} /> Revenue Overview</h3>{mounted ? (<ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} /><Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} /><Bar dataKey="amount" radius={[4, 4, 0, 0]}>{chartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={index === 2 ? '#D4AF37' : '#e5e7eb'} />))}</Bar></BarChart></ResponsiveContainer>) : <div className="h-full w-full bg-gray-50 animate-pulse rounded-xl"></div>}</div>
                    <AnimatePresence mode="popLayout">
                        <div className="grid gap-6">
                            {jobs.map((job) => (
                                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} whileHover={{ scale: 1.02, y: -4 }} className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between gap-6">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-3"><h3 className="text-xl font-bold">{job.name || 'Unknown'}</h3><select value={job.status} onChange={(e) => handleStatusUpdate(job.id, e.target.value)} className="px-3 py-1 text-xs font-bold rounded bg-gray-100 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors">{getNextStatuses(job.status).map((s) => (<option key={s} value={s}>{s}</option>))}</select></div>
                                        <div className="text-sm text-gray-500 flex gap-4"><span className="flex items-center gap-1"><MapPin size={14} /> {job.address}</span><span className="flex items-center gap-1"><Phone size={14} /> {job.phone}</span></div>
                                        <div className="flex items-center gap-2 mt-2 bg-gray-50 p-2 rounded w-fit"><span className="font-bold text-gray-400">$</span><input type="number" defaultValue={job.price} onBlur={(e) => handlePrice(job.id, e.target.value)} className="bg-transparent font-bold w-20 outline-none" />{job.price && (<div className="flex items-center gap-2 border-l pl-2 border-gray-300"><a href={`/invoice/${job.id}`} target="_blank" className="text-[#D4AF37] text-xs font-bold flex items-center gap-1 hover:underline"><FileText size={12} /> View</a><button onClick={() => handleSendInvoice(job.id)} className="text-blue-500 text-xs font-bold hover:underline">Send</button><button onClick={() => { setEditingJob(job); setEditForm({ discount: job.discount || 0, taxRate: job.taxRate || 13, invoiceNotes: job.invoiceNotes || "" }); setShowSettingsModal(true); }} className="text-gray-400 hover:text-black transition-colors"><Settings size={12} /></button></div>)}</div>
                                    </div>
                                    <div className="flex flex-col gap-2 justify-center border-l pl-6 w-full md:w-40">
                                        {/* SCHEDULE / RESCHEDULE LOGIC */}
                                        {(job.status === 'LEAD_RECEIVED' || job.status === 'SCHEDULED') && (
                                            <button onClick={() => { setSchedulingJobId(job.id); setIsScheduleModalOpen(true); }} disabled={syncingJobId === job.id} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50">
                                                {syncingJobId === job.id ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={14} /> Syncing...</span> : job.status === 'SCHEDULED' ? "Reschedule" : "Schedule"}
                                            </button>
                                        )}
                                        {/* ON MY WAY BUTTON */}
                                        {job.status === 'SCHEDULED' && (<><button onClick={() => handleOnMyWay(job.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Truck size={14} /> On My Way</button><button onClick={() => handleStatusUpdate(job.id, 'COMPLETED')} className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition-all">Complete</button></>)}
                                        {/* RECURRING BUTTON */}
                                        {(job.status === 'COMPLETED' || job.status === 'PAID') && (<button onClick={() => handleRecurring(job.id)} className="bg-purple-100 text-purple-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-200 transition-all flex items-center justify-center gap-2"><Repeat size={14} /> Recurring</button>)}
                                        <button onClick={() => handleDelete(job.id)} className="bg-red-50 text-red-500 px-4 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-100 transition-all"><Trash2 size={14} /> Delete</button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                </div>
            </main>

            {/* INVOICE SETTINGS MODAL */}
            {showSettingsModal && editingJob && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6"><h3 className="font-black text-xl">Invoice Settings</h3><button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-black"><X size={24} /></button></div>
                        <div className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Discount Amount ($)</label><input type="number" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tax Rate (%)</label><input type="number" value={editForm.taxRate} onChange={(e) => setEditForm({ ...editForm, taxRate: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" /></div>
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Notes</label><textarea value={editForm.invoiceNotes} onChange={(e) => setEditForm({ ...editForm, invoiceNotes: e.target.value })} className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none h-24" placeholder="Thank you for your business..." /></div>
                            <button onClick={async () => { await updateJobDetails(editingJob.id, editForm); setShowSettingsModal(false); }} className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all mt-4">Save Settings</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* SCHEDULE MODAL */}
            {isScheduleModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                        <h3 className="font-black text-xl mb-4">Schedule Appointment</h3>
                        <p className="text-gray-500 text-sm mb-6">Select a date and time to confirm this booking and sync with Google Calendar.</p>
                        <input type="datetime-local" className="w-full bg-gray-50 p-3 rounded-xl font-bold outline-none ring-1 ring-gray-200 focus:ring-[#D4AF37] mb-6" onChange={(e) => { setScheduleDate(e.target.value); setSyncError(null); }} />
                        {syncError && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-bold mb-6">⚠️ {syncError}</div>}
                        <div className="flex gap-4"><button onClick={() => { setIsScheduleModalOpen(false); setSyncError(null); }} className="flex-1 bg-gray-100 text-gray-500 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button><button onClick={async () => { if (schedulingJobId && scheduleDate) { setSyncingJobId(schedulingJobId); setSyncError(null); const result = await confirmBooking(schedulingJobId, scheduleDate); setSyncingJobId(null); if (result.success) { alert("✅ Scheduled!"); setIsScheduleModalOpen(false); } else { setSyncError(result.error); } } else { alert("Please select a date."); } }} disabled={!!syncingJobId} className="flex-1 bg-black text-white py-3 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-colors disabled:opacity-50">{syncingJobId ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin" size={16} /> Syncing...</span> : "Confirm"}</button></div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}