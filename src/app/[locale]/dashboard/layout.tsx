"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Menu, X, Home, Inbox, Building2, Users, Sparkles, LogOut, Calendar, Bot, TrendingUp, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ModeToggle } from "@/components/mode-toggle";
import { useTheme } from "next-themes";

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
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Theme state
    const { theme, systemTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const { auth } = await import('@/lib/firebase/client');
            const { signOut } = await import('firebase/auth');
            await signOut(auth);
            router.push(`/${locale}/login`);
        } catch (error) {
            console.error("Error signing out:", error);
            setIsLoggingOut(false);
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = theme === 'system' ? systemTheme : theme;

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
            <aside className={`border-r border-border bg-card hidden md:flex flex-col transition-all duration-300 relative ${isCollapsed ? 'w-20' : 'w-64'}`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-6 bg-background border border-border rounded-full p-1 text-muted-foreground hover:text-foreground z-10 hover:scale-110 transition-transform shadow-sm"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>

                <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center px-4' : ''}`}>
                    {/* Logo Update */}
                    {!isCollapsed ? (
                        <Link href={`/${locale}/dashboard`} className="block w-full">
                            {!mounted ? (
                                <div className="h-10"></div>
                            ) : currentTheme === 'dark' ? (
                                <img
                                    src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo-blanco.png?alt=media&token=e6caedc9-a247-4e7d-a4ed-c3af55912c4d"
                                    alt="Nelson Vallejo Real Estate"
                                    className="h-10 w-auto object-contain"
                                />
                            ) : (
                                <img
                                    src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo.png?alt=media&token=9ca6bbfe-2541-4301-9d85-c335efd5f153"
                                    alt="Nelson Vallejo Real Estate"
                                    className="h-12 w-auto object-contain"
                                />
                            )}
                        </Link>
                    ) : (
                        <Link href={`/${locale}/dashboard`} className="block w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="font-bold text-primary">N</span>
                        </Link>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        // Simple active check logic could be added here
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'} rounded-lg text-sm font-medium transition-colors cursor-pointer text-muted-foreground hover:text-foreground hover:bg-accent group`}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon size={18} className="group-hover:text-primary transition-colors shrink-0" />
                                {!isCollapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>
                <div className={`p-4 border-t border-border ${isCollapsed ? 'flex justify-center' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0" title={user.email || ""}>
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        {!isCollapsed && (
                            <div className="overflow-hidden flex-1">
                                <p className="text-sm font-medium truncate">{user.email}</p>
                                <p className="text-xs text-muted-foreground capitalize">{role || 'User'}</p>
                            </div>
                        )}
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
                                    <Link href={`/${locale}/dashboard`} className="block w-full">
                                        {!mounted ? (
                                            <div className="h-8"></div>
                                        ) : currentTheme === 'dark' ? (
                                            <img
                                                src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo-blanco.png?alt=media&token=e6caedc9-a247-4e7d-a4ed-c3af55912c4d"
                                                alt="Nelson Vallejo Real Estate"
                                                className="h-8 w-auto object-contain"
                                            />
                                        ) : (
                                            <img
                                                src="https://firebasestorage.googleapis.com/v0/b/real-state-nelva.firebasestorage.app/o/web%2Flogo.png?alt=media&token=e59824a2-1159-4fe7-9ea2-131c3a32ae22"
                                                alt="Nelson Vallejo Real Estate"
                                                className="h-8 w-auto object-contain"
                                            />
                                        )}
                                    </Link>
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
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg text-sm font-medium transition-colors"
                                >
                                    {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                                    {isLoggingOut ? "Logging out..." : "Log Out"}
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
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                        >
                            {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                            {isLoggingOut ? "Logging out..." : "Log Out"}
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
