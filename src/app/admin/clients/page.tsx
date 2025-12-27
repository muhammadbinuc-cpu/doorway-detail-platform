"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { Loader2, Search, Plus, MapPin, Phone, Mail, LayoutDashboard, Users, LogOut } from "lucide-react";
import Link from "next/link";
// IMPORT ACTIONS
import { createClient, createJobFromClient } from "@/app/actions";

interface Client {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    status: 'LEAD' | 'ACTIVE' | 'CHURNED';
    totalSpent: number;
    lastServiceDate: any;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const [newClient, setNewClient] = useState({
        name: "", email: "", phone: "", address: "", propertyNotes: ""
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                const q = query(collection(db, "clients"), orderBy("name"));
                onSnapshot(q, (snap) => {
                    setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
                    setLoading(false);
                });
            } else { router.push("/login"); }
        });
        return () => unsubscribe();
    }, [router]);

    const handleAddClient = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClient.name) return;

        // ✅ USE SERVER ACTION
        const result = await createClient({
            name: newClient.name,
            email: newClient.email,
            phone: newClient.phone,
            address: newClient.address,
            propertyNotes: newClient.propertyNotes
        });

        if (result.success) {
            setIsModalOpen(false);
            setNewClient({ name: "", email: "", phone: "", address: "", propertyNotes: "" });
            alert("✅ Client Added!");
        } else {
            alert("❌ Failed: " + result.error);
        }
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            <aside className="w-full md:w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 text-white p-6 flex flex-col">
                <h1 className="text-2xl font-black italic mb-8">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
                <nav className="space-y-2 flex-1">
                    <Link href="/admin" className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all block">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <div className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3">
                        <Users size={20} /> Clients
                    </div>
                </nav>
                <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors mt-8">
                    <LogOut size={16} /> Sign Out
                </button>
            </aside>

            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-black">Client Directory</h1>
                            <p className="text-gray-500 mt-1">Manage your relationships and history.</p>
                        </div>
                        <button onClick={() => setIsModalOpen(true)} className="bg-black text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#D4AF37] hover:text-black transition-all">
                            <Plus size={18} /> Add Client
                        </button>
                    </div>

                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
                        <Search className="text-gray-400" size={20} />
                        <input type="text" placeholder="Search by name, email, or address..." className="flex-1 outline-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-6 text-xs font-bold text-gray-400 uppercase">Client Name</th>
                                    <th className="p-6 text-xs font-bold text-gray-400 uppercase">Contact</th>
                                    <th className="p-6 text-xs font-bold text-gray-400 uppercase">Status</th>
                                    <th className="p-6 text-xs font-bold text-gray-400 uppercase text-right">Lifetime Value</th>
                                    <th className="p-6 text-xs font-bold text-gray-400 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map((client) => (
                                    <tr key={client.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                        <td className="p-6 font-bold">{client.name}</td>
                                        <td className="p-6 text-sm text-gray-500">
                                            <div className="flex items-center gap-2 mb-1"><Mail size={12} /> {client.email}</div>
                                            <div className="flex items-center gap-2"><Phone size={12} /> {client.phone}</div>
                                        </td>
                                        <td className="p-6">
                                            <span className={`px-2 py-1 text-xs font-bold rounded ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800'}`}>{client.status}</span>
                                        </td>
                                        <td className="p-6 text-right font-bold text-[#D4AF37]">${client.totalSpent?.toFixed(2) || '0.00'}</td>
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <Link href={`/admin/clients/${client.id}`} className="text-sm font-bold text-[#D4AF37] hover:underline">
                                                    View Profile →
                                                </Link>
                                                <button
                                                    onClick={async () => {
                                                        const result = await createJobFromClient(client.id);
                                                        if (result.success) {
                                                            alert("✅ Job created successfully!");
                                                            router.push("/admin");
                                                        } else {
                                                            alert("❌ Failed: " + result.error);
                                                        }
                                                    }}
                                                    className="text-sm font-bold bg-black text-white px-3 py-1 rounded-lg hover:bg-[#D4AF37] hover:text-black transition-colors"
                                                >
                                                    Create Job
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
                        <h2 className="text-2xl font-black mb-6">Add New Client</h2>
                        <form onSubmit={handleAddClient} className="space-y-4">
                            <input placeholder="Full Name" required className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} />
                            <input placeholder="Email" type="email" required className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
                            <input placeholder="Phone" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
                            <input placeholder="Address" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]" value={newClient.address} onChange={e => setNewClient({ ...newClient, address: e.target.value })} />
                            <textarea placeholder="Property Notes (Gate code, etc.)" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#D4AF37] resize-none h-24" value={newClient.propertyNotes} onChange={e => setNewClient({ ...newClient, propertyNotes: e.target.value })} />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-4 rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
                                <button type="submit" className="flex-1 bg-black text-white p-4 rounded-xl font-bold hover:bg-[#D4AF37] hover:text-black">Save Client</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}