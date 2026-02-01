"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Menu, X, Home, Inbox, Building2, Users, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading, role } = useAuth();
    const router = useRouter();
    const params = useParams();
    const locale = params.locale as string;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push(`/${locale}/login`);
        }
    }, [user, loading, router, locale]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [params]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!user) return null;

    const menuItems = [
        { href: `/${locale}/dashboard`, label: 'Overview', icon: Home },
        { href: `/${locale}/dashboard/inbox`, label: 'Inbox', icon: Inbox },
        { href: `/${locale}/dashboard/properties`, label: 'Properties', icon: Building2 },
        { href: `/${locale}/dashboard/crm`, label: 'Leads', icon: Users },
        { href: `/${locale}/dashboard/content`, label: 'Content AI', icon: Sparkles },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
                <div className="p-6 font-bold text-xl tracking-wider">
                    VISION<span className="text-blue-500">REALTY</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer text-slate-400 hover:text-white group"
                            >
                                <Icon size={18} className="group-hover:scale-110 transition-transform" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-slate-500 capitalize">{role || 'User'}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileMenuOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/50 z-40"
                        />

                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col z-50"
                        >
                            <div className="p-6 font-bold text-xl tracking-wider flex items-center justify-between">
                                <span>VISION<span className="text-blue-500">REALTY</span></span>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 hover:bg-slate-800 rounded-lg"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <nav className="flex-1 p-4 space-y-2">
                                {menuItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <motion.div
                                            key={item.href}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={item.href}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors cursor-pointer text-slate-400 hover:text-white active:scale-95 group"
                                            >
                                                <Icon size={20} className="group-hover:scale-110 transition-transform" />
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-slate-800 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                        <p className="text-xs text-slate-500 capitalize">{role || 'User'}</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <LogOut size={16} />
                                    Log Out
                                </motion.button>
                            </div>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="flex-1 overflow-auto h-screen">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    {/* Mobile Menu Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setMobileMenuOpen(true)}
                        className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <Menu size={24} className="text-slate-700" />
                    </motion.button>

                    <h1 className="text-lg font-semibold text-slate-800">Dashboard</h1>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="hidden md:block text-sm text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    >
                        Log Out
                    </motion.button>

                    {/* Mobile: User Avatar as visual indicator */}
                    <div className="md:hidden w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                </header>
                <div className="p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
