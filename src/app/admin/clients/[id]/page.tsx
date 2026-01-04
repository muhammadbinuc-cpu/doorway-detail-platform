"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, Loader2 } from "lucide-react";
import { createJobFromClient } from "../../../actions";

// ✅ TASK 4: Client Profile Page with Debug Logging
export default function ClientProfile() {
    const params = useParams();
    const id = params?.id as string;
    const [client, setClient] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creatingJob, setCreatingJob] = useState(false);
    const router = useRouter();

    // ✅ TASK 4: Debug logging
    console.log("Client ID:", id);

    useEffect(() => {
        // ✅ TASK 4: Early return if no ID
        if (!id) return;

        const fetchData = async () => {
            try {
                const snap = await getDoc(doc(db, "clients", id));
                if (snap.exists()) setClient({ id: snap.id, ...snap.data() });

                const q = query(collection(db, "jobs"), where("clientId", "==", id), orderBy("createdAt", "desc"));
                const jobs = await getDocs(q);
                setHistory(jobs.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleNewJob = async () => {
        if (!confirm("Start a new Window Cleaning job for this client?")) return;
        setCreatingJob(true);

        // Call Server Action
        const res = await createJobFromClient(id);

        if (res.success) {
            router.push("/admin");
        } else {
            alert("Error: " + res.error);
            setCreatingJob(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-black text-[#D4AF37]"><Loader2 className="animate-spin" /></div>;
    if (!client) return <div className="p-10">Client not found</div>;

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-black p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin/clients" className="flex items-center gap-2 text-gray-500 hover:text-black mb-8 font-bold">
                    <ArrowLeft size={18} /> Back to Clients
                </Link>

                {/* PROFILE HEADER */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-black mb-2">{client.name}</h1>
                        <div className="flex flex-wrap gap-4 text-gray-500 font-medium">
                            <span className="flex items-center gap-2"><Mail size={16} /> {client.email}</span>
                            <span className="flex items-center gap-2"><Phone size={16} /> {client.phone}</span>
                            <span className="flex items-center gap-2"><MapPin size={16} /> {client.address}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleNewJob}
                        disabled={creatingJob}
                        className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black transition-all disabled:opacity-50"
                    >
                        {creatingJob ? <Loader2 className="animate-spin" /> : "+ Start New Job"}
                    </button>
                </div>

                {/* JOB HISTORY */}
                <h3 className="text-xl font-black mb-4 uppercase text-gray-400">Job History</h3>
                <div className="space-y-4">
                    {history.length === 0 && <p className="text-gray-400 italic">No previous jobs found.</p>}
                    {history.map(job => (
                        <div key={job.id} className="bg-white p-6 rounded-2xl border flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-lg">{job.service}</h4>
                                <p className="text-sm text-gray-400">
                                    {job.createdAt?.seconds ? new Date(job.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${job.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                job.status === 'INVOICED' ? 'bg-blue-100 text-blue-700' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                {job.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}