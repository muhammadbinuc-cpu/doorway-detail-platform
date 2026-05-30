"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LayoutDashboard, FileText, CalendarDays, Users, LogOut } from "lucide-react";

export type AdminNav = "dashboard" | "invoices" | "schedule" | "clients";

const ITEMS: { key: AdminNav; href: string; label: string; Icon: typeof LayoutDashboard }[] = [
    { key: "dashboard", href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
    { key: "invoices", href: "/admin/invoices", label: "Invoices", Icon: FileText },
    { key: "schedule", href: "/admin/schedule", label: "Schedule", Icon: CalendarDays },
    { key: "clients", href: "/admin/clients", label: "Clients", Icon: Users },
];

export function AdminSidebar({ active }: { active: AdminNav }) {
    return (
        <aside className="w-full md:w-64 bg-black/90 backdrop-blur-xl border-r border-white/10 text-white p-6 flex flex-col">
            <h1 className="text-2xl font-black italic mb-8">DOORWAY <span className="text-[#D4AF37]">DETAIL</span></h1>
            <nav className="space-y-2 flex-1">
                {ITEMS.map(({ key, href, label, Icon }) =>
                    key === active ? (
                        <div key={key} className="bg-white/10 text-[#D4AF37] px-4 py-3 rounded-xl font-bold flex items-center gap-3">
                            <Icon size={20} /> {label}
                        </div>
                    ) : (
                        <Link key={key} href={href} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all block">
                            <Icon size={20} /> {label}
                        </Link>
                    )
                )}
            </nav>
            <button onClick={() => signOut(auth)} className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors mt-8">
                <LogOut size={16} /> Sign Out
            </button>
        </aside>
    );
}
