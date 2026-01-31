"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, role } = useAuth();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`); // Dynamic local
        }
    }, [user, loading, router, locale]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar Placeholder */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 font-bold text-xl tracking-wider">
                    VISION<span className="text-blue-500">REALTY</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href={`/${locale}/dashboard`} className="block px-4 py-2 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer text-slate-400 hover:text-white">Overview</Link>
                    <Link href={`/${locale}/dashboard/inbox`} className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Inbox</Link>
                    <Link href={`/${locale}/dashboard/properties`} className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Properties</Link>
                    <Link href={`/${locale}/dashboard/crm`} className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Leads (CRM)</Link>
                    <Link href={`/${locale}/dashboard/content`} className="block px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer">Content AI</Link>
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{role || 'User'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-screen">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>
                    <button className="text-sm text-slate-500 hover:text-slate-900 font-medium">
                        Log Out
                    </button>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
