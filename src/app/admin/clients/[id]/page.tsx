"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, Loader2, Trash2, Save, FileText } from "lucide-react";
import { createJobFromClient, deleteClient, updateClientNotes } from "@/app/actions";

export default function ClientProfile() {
    const params = useParams();
    const id = params?.id as string;
    const [client, setClient] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingJob, setCreatingJob] = useState(false);
    const [notes, setNotes] = useState("");
    const [savingNotes, setSavingNotes] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            try {
                const snap = await getDoc(doc(db, "clients", id));
                if (snap.exists()) {
                    const data = snap.data();
                    setClient({ id: snap.id, ...data });
                    setNotes(data.propertyNotes || "");
                }
                const q = query(collection(db, "jobs"), where("clientId", "==", id), orderBy("createdAt", "desc"));
                const jobs = await getDocs(q);
                setHistory(jobs.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
    }, [id]);

    const handleNewJob = async () => {
        if (!confirm("Start a new job?")) return;
        setCreatingJob(true);
        const res = await createJobFromClient(id);
        if (res.success) router.push("/admin");
        else { alert(res.error); setCreatingJob(false); }
    };

    const handleDelete = async () => {
        if (!confirm("⚠️ ARE YOU SURE? This will permanently delete this client.")) return;
        const res = await deleteClient(id);
        if (res.success) router.push("/admin/clients");
        else alert(res.error);
    };

    const handleSaveNotes = async () => {
        setSavingNotes(true);
        await updateClientNotes(id, notes);
        setSavingNotes(false);
        alert("Notes saved!");
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!client) return <div>Client not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-black p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <Link href="/admin/clients" className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold">
                    <ArrowLeft size={18} /> Back to Clients
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Profile & Notes */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border relative overflow-hidden">
                            <div className="relative z-10">
                                <h1 className="text-4xl font-black mb-4">{client.name}</h1>
                                <div className="space-y-3 text-gray-600 font-medium">
                                    <div className="flex items-center gap-3"><Mail size={18} /> {client.email}</div>
                                    <div className="flex items-center gap-3"><Phone size={18} /> {client.phone}</div>
                                    <div className="flex items-center gap-3"><MapPin size={18} /> {client.address}</div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        </div>

                        {/* Property Notes */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-black flex items-center gap-2"><FileText size={20} /> Property Notes</h3>
                                <button onClick={handleSaveNotes} disabled={savingNotes} className="text-sm font-bold text-[#D4AF37] hover:underline flex items-center gap-1">
                                    {savingNotes ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Notes
                                </button>
                            </div>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full h-32 bg-gray-50 rounded-xl p-4 font-medium outline-none border border-transparent focus:border-[#D4AF37] transition-all resize-none"
                                placeholder="Enter gate codes, preferences, or dog names here..."
                            />
                        </div>

                        {/* Job History */}
                        <div>
                            <h3 className="text-lg font-black mb-4 text-gray-400 uppercase">Job History</h3>
                            <div className="space-y-4">
                                {history.length === 0 && <p className="text-gray-400 italic">No jobs yet.</p>}
                                {history.map(job => (
                                    <div key={job.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-bold">{job.service}</h4>
                                            <p className="text-xs text-gray-400">{job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                job.status === 'INVOICED' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-800'
                                            }`}>{job.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Actions */}
                    <div className="space-y-4">
                        <button
                            onClick={handleNewJob}
                            disabled={creatingJob}
                            className="w-full bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {creatingJob ? <Loader2 className="animate-spin" /> : "+ Start New Job"}
                        </button>

                        <button
                            onClick={handleDelete}
                            className="w-full bg-red-50 text-red-500 p-4 rounded-xl font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} /> Delete Client
                        </button>

                        <div className="bg-blue-50 p-6 rounded-2xl text-blue-900 text-sm font-medium">
                            <p className="mb-2"><strong>💡 Pro Tip:</strong></p>
                            Use the "Property Notes" to track gate codes or specific cleaning instructions to ensure consistent service.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}