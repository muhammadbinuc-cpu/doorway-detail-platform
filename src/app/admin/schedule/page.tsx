"use client";

import { useEffect, useMemo, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { Loader2, ChevronLeft, ChevronRight, MapPin, CalendarDays } from "lucide-react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { statusMeta } from "@/lib/job-status";

interface SchedJob {
    id: string;
    name?: string;
    service?: string;
    address?: string;
    status: string;
    scheduledDate?: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Local YYYY-MM-DD key for a Date (avoids UTC off-by-one).
const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export default function SchedulePage() {
    const [jobs, setJobs] = useState<SchedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
    const [selectedKey, setSelectedKey] = useState<string>(() => dayKey(new Date()));
    const router = useRouter();

    useEffect(() => {
        let unsubSnap: (() => void) | null = null;
        const unsubAuth = onAuthStateChanged(auth, (u) => {
            if (u) {
                setUser(u);
                const q = query(collection(db, "jobs"), orderBy("createdAt", "desc"), limit(200));
                unsubSnap = onSnapshot(q, (snap) => {
                    setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() } as SchedJob)).filter(j => !!j.scheduledDate));
                    setLoading(false);
                }, (error) => { if (error.code !== "permission-denied") console.error("Firestore Error:", error); });
            } else { if (unsubSnap) unsubSnap(); router.push("/login"); }
        });
        return () => { if (unsubSnap) unsubSnap(); unsubAuth(); };
    }, [router]);

    // Group jobs by local day key.
    const byDay = useMemo(() => {
        const map: Record<string, SchedJob[]> = {};
        for (const j of jobs) {
            if (!j.scheduledDate) continue;
            const d = new Date(j.scheduledDate);
            if (isNaN(d.getTime())) continue;
            (map[dayKey(d)] ||= []).push(j);
        }
        return map;
    }, [jobs]);

    // Build the calendar grid (leading blanks + days of the month).
    const cells = useMemo(() => {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const out: (Date | null)[] = [];
        for (let i = 0; i < firstWeekday; i++) out.push(null);
        for (let d = 1; d <= daysInMonth; d++) out.push(new Date(year, month, d));
        return out;
    }, [cursor]);

    const todayKey = dayKey(new Date());
    const selectedJobs = byDay[selectedKey] || [];
    const goMonth = (delta: number) => setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1));

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-black">
            <AdminSidebar active="schedule" />

            <main className="flex-1 p-6 md:p-10 overflow-auto">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-black">Schedule</h1>
                            <p className="text-gray-500 mt-1">Your booked jobs at a glance.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => goMonth(-1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"><ChevronLeft size={18} /></button>
                            <span className="font-bold w-44 text-center">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</span>
                            <button onClick={() => goMonth(1)} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 transition-colors"><ChevronRight size={18} /></button>
                            <button onClick={() => { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)); setSelectedKey(dayKey(n)); }} className="ml-2 px-3 py-2 rounded-lg bg-black text-white text-sm font-bold hover:bg-[#D4AF37] hover:text-black transition-colors">Today</button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
                        {/* CALENDAR */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
                            <div className="grid grid-cols-7 mb-2">
                                {WEEKDAYS.map(w => <div key={w} className="text-center text-xs font-bold text-gray-400 uppercase py-2">{w}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {cells.map((date, i) => {
                                    if (!date) return <div key={`b${i}`} />;
                                    const key = dayKey(date);
                                    const dayJobs = byDay[key] || [];
                                    const isToday = key === todayKey;
                                    const isSelected = key === selectedKey;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setSelectedKey(key)}
                                            className={`min-h-[84px] rounded-xl border p-1.5 text-left align-top transition-colors ${isSelected ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-gray-100 hover:bg-gray-50"}`}
                                        >
                                            <span className={`inline-grid place-items-center w-6 h-6 text-xs font-bold rounded-full ${isToday ? "bg-black text-white" : "text-gray-600"}`}>{date.getDate()}</span>
                                            <div className="mt-1 space-y-1">
                                                {dayJobs.slice(0, 3).map(j => {
                                                    const m = statusMeta(j.status);
                                                    return <div key={j.id} className={`flex items-center gap-1 text-[10px] font-bold rounded px-1 py-0.5 truncate ${m.pill}`}><span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0`} />{j.name || "Job"}</div>;
                                                })}
                                                {dayJobs.length > 3 && <div className="text-[10px] text-gray-400 font-bold px-1">+{dayJobs.length - 3} more</div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* DAY DETAIL */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 h-fit">
                            <h3 className="font-black text-lg flex items-center gap-2 mb-4"><CalendarDays size={18} /> {new Date(selectedKey + "T00:00:00").toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}</h3>
                            {selectedJobs.length === 0 && <p className="text-gray-400 italic text-sm">No jobs scheduled.</p>}
                            <div className="space-y-3">
                                {selectedJobs
                                    .sort((a, b) => (a.scheduledDate || "").localeCompare(b.scheduledDate || ""))
                                    .map(j => {
                                        const m = statusMeta(j.status);
                                        const t = j.scheduledDate ? new Date(j.scheduledDate).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" }) : "";
                                        return (
                                            <Link key={j.id} href="/admin" className="block bg-gray-50 rounded-2xl p-4 hover:shadow-md transition-shadow">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-bold">{j.name || "Job"}</span>
                                                    <span className="text-xs font-semibold text-gray-500">{t}</span>
                                                </div>
                                                <p className="text-sm text-gray-500">{j.service}</p>
                                                {j.address && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={11} /> {j.address}</p>}
                                                <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded ${m.pill}`}>{m.label}</span>
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
