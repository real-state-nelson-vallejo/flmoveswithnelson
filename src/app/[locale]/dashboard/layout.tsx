"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Menu, X, Home, Inbox, Building2, Users, Sparkles, LogOut, Calendar, Bot, TrendingUp, FileText } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";

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
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-muted-foreground" size={32} />
            </div>
        );
    }

    if (!user) return null;

    const menuItems = [
        { href: `/${locale}/dashboard`, label: 'Overview', icon: Home },
        { href: `/${locale}/dashboard/inbox`, label: 'Inbox', icon: Inbox },
        { href: `/${locale}/dashboard/properties`, label: 'Properties', icon: Building2 },
        { href: `/${locale}/dashboard/opportunities`, label: 'Opportunities', icon: TrendingUp },
        { href: `/${locale}/dashboard/documents`, label: 'Documents', icon: FileText },
        { href: `/${locale}/dashboard/crm`, label: 'Leads', icon: Users },
        { href: `/${locale}/dashboard/content`, label: 'Content AI', icon: Sparkles },
        { href: `/${locale}/dashboard/ai-agent`, label: 'AI Agent', icon: Bot },
        { href: `/${locale}/dashboard/calendar`, label: 'Calendar', icon: Calendar },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Desktop Sidebar */}
            <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                <div className="p-6">
                    {/* Logo Update */}
                    <div className="font-bold text-xl tracking-wider text-foreground">
                        NELSON <span className="text-primary font-light">VALLEJO</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-1">Real Estate</p>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        // Simple active check logic could be added here
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent group"
                            >
                                <Icon size={18} className="group-hover:text-primary transition-colors" />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate">{user.email}</p>
                            <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
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
                            className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex flex-col z-50"
                        >
                            <div className="p-6 flex items-center justify-between">
                                <div>
                                    <div className="font-bold text-xl tracking-wider text-foreground">
                                        NELSON <span className="text-primary font-light">VALLEJO</span>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-1 hover:bg-accent rounded-lg text-muted-foreground"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>

                            <nav className="flex-1 p-4 space-y-1">
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
                                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent group"
                                            >
                                                <Icon size={20} className="group-hover:text-primary transition-colors" />
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </nav>

                            <div className="p-4 border-t border-border space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <p className="text-sm font-medium truncate">{user.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
                                    </div>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition-colors"
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
            <main className="flex-1 overflow-auto h-screen bg-background">
                <header className="h-16 border-b border-border bg-background/80 backdrop-blur w-full flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
                        >
                            <Menu size={24} />
                        </motion.button>

                        {/* Breadcrumbs or Page Title could go here */}
                    </div>

                    <div className="flex items-center gap-4">
                        <ModeToggle />

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            className="hidden md:block text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                            Log Out
                        </motion.button>

                        {/* Mobile: User Avatar as visual indicator */}
                        <div className="md:hidden w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>
                <div className="flex-1">
                    {children}
                </div>
            </main>
        </div>
    );
}
