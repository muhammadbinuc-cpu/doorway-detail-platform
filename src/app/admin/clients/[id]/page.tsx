"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, useParams } from "next/navigation";
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { Loader2, ArrowLeft, Phone, Mail, MapPin, Calendar, DollarSign, FileText } from "lucide-react";
import Link from "next/link";

interface Client {
    name: string;
    email: string;
    phone: string;
    address: string;
    gateCode: string;
    propertyNotes: string;
    referralSource: string;
    totalSpent: number;
    jobCount: number;
    lastServiceDate: any;
    status: string;
    tags: string[];
}

interface Job {
    id: string;
    service: string;
    status: string;
    price?: number;
    createdAt: any;
}

export default function ClientProfilePage() {
    const params = useParams();
    const clientId = params.id as string;
    const [client, setClient] = useState<Client | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const router = useRouter();

    const [editableClient, setEditableClient] = useState<Partial<Client>>({});

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);

                // Fetch client data
                const clientDoc = await getDoc(doc(db, "clients", clientId));
                if (clientDoc.exists()) {
                    const clientData = clientDoc.data() as Client;
                    setClient(clientData);
                    setEditableClient(clientData);
                }

                // Fetch jobs for this client
                const q = query(collection(db, "jobs"), where("clientId", "==", clientId));
                onSnapshot(q, (snap) => {
                    const jobsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Job));
                    setJobs(jobsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
                    setLoading(false);
                });
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribeAuth();
    }, [clientId, router]);

    const handleSave = async (field: keyof Client, value: any) => {
        try {
            await updateDoc(doc(db, "clients", clientId), {
                [field]: value
            });
        } catch (error) {
            console.error("Error updating client:", error);
        }
    };

    const totalRevenue = jobs
        .filter(j => j.status === "COMPLETED" && j.price)
        .reduce((sum, j) => sum + (j.price || 0), 0);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
    if (!user || !client) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-6 md:p-10">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/admin/clients" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft size={16} /> Back to Directory
                    </Link>
                    <h1 className="text-4xl font-black text-gray-900">{client.name}</h1>
                    <p className="text-gray-500 mt-1">Client Profile</p>
                </div>

                {/* Revenue Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-[#D4AF37] to-[#b5952f] text-black p-8 rounded-3xl mb-8 shadow-xl"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-bold opacity-70 mb-2">TOTAL REVENUE FROM CLIENT</div>
                            <div className="text-5xl font-black">${totalRevenue.toFixed(2)}</div>
                        </div>
                        <DollarSign size={64} className="opacity-20" />
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Rolodex */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-3xl p-6">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Contact Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Name</label>
                                    <input
                                        type="text"
                                        value={editableClient.name || ""}
                                        onChange={(e) => setEditableClient({ ...editableClient, name: e.target.value })}
                                        onBlur={(e) => handleSave("name", e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37] font-bold"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <Mail size={16} className="text-gray-400" />
                                        <input
                                            type="email"
                                            value={editableClient.email || ""}
                                            onChange={(e) => setEditableClient({ ...editableClient, email: e.target.value })}
                                            onBlur={(e) => handleSave("email", e.target.value.toLowerCase())}
                                            className="flex-1 bg-transparent focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Phone</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <Phone size={16} className="text-gray-400" />
                                        <input
                                            type="tel"
                                            value={editableClient.phone || ""}
                                            onChange={(e) => setEditableClient({ ...editableClient, phone: e.target.value })}
                                            onBlur={(e) => handleSave("phone", e.target.value)}
                                            className="flex-1 bg-transparent focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Address</label>
                                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                                        <MapPin size={16} className="text-gray-400" />
                                        <input
                                            type="text"
                                            value={editableClient.address || ""}
                                            onChange={(e) => setEditableClient({ ...editableClient, address: e.target.value })}
                                            onBlur={(e) => handleSave("address", e.target.value)}
                                            className="flex-1 bg-transparent focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Gate Code</label>
                                    <input
                                        type="text"
                                        value={editableClient.gateCode || ""}
                                        onChange={(e) => setEditableClient({ ...editableClient, gateCode: e.target.value })}
                                        onBlur={(e) => handleSave("gateCode", e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                                        placeholder="e.g., 1234"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Private Notes */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6">
                            <h3 className="text-lg font-black text-gray-900 mb-4">Private Admin Notes</h3>
                            <textarea
                                value={editableClient.propertyNotes || ""}
                                onChange={(e) => setEditableClient({ ...editableClient, propertyNotes: e.target.value })}
                                onBlur={(e) => handleSave("propertyNotes", e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37] resize-none h-40"
                                placeholder="Dog in backyard, key under mat, prefers morning appointments..."
                            />
                        </div>
                    </div>

                    {/* Right Column: Job History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status & Actions Control Panel */}
                        <div className="bg-white border border-gray-200 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex items-center gap-4 w-full md:w-auto">
                                <label className="font-bold text-gray-500 text-sm uppercase">Client Status:</label>
                                <select
                                    value={client.status}
                                    onChange={(e) => handleSave("status", e.target.value)}
                                    className="bg-gray-100 font-bold px-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-[#D4AF37]"
                                >
                                    <option value="LEAD">LEAD</option>
                                    <option value="SCHEDULED">SCHEDULED</option>
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="CHURNED">CHURNED</option>
                                    <option value="LOST">LOST</option>
                                </select>
                            </div>

                            <button
                                onClick={async () => {
                                    if (confirm("Are you sure? This effectively deletes the client profile.")) {
                                        await deleteDoc(doc(db, "clients", clientId));
                                        router.push("/admin/clients");
                                    }
                                }}
                                className="bg-red-50 text-red-500 px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors w-full md:w-auto text-center"
                            >
                                Delete Client
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-3xl p-6">
                            <h3 className="text-lg font-black text-gray-900 mb-6">Job History ({jobs.length})</h3>

                            {jobs.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <FileText className="mx-auto mb-4 opacity-20" size={48} />
                                    <p>No jobs on record yet</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {jobs.map((job) => (
                                        <motion.div
                                            key={job.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="border border-gray-200 rounded-2xl p-5 hover:border-[#D4AF37] transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{job.service}</h4>
                                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                        <Calendar size={14} />
                                                        {job.createdAt?.seconds
                                                            ? new Date(job.createdAt.seconds * 1000).toLocaleDateString()
                                                            : "Recently"}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                        job.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {job.status}
                                                    </span>
                                                    {job.price && (
                                                        <div className="text-lg font-black text-[#D4AF37] mt-2">
                                                            ${job.price.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}