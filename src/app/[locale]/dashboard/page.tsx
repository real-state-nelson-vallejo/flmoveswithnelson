"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    Building2, Users, TrendingUp, Wallet, Activity, Loader2, CheckCircle2, XCircle,
    Star, Gem, Waves, Sparkles, Archive, PauseCircle, AlertTriangle, ArrowRight,
    Clock,
} from "lucide-react";
import { getDashboardOverviewAction, type DashboardOverview } from "@/actions/dashboard/overview";

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: value >= 1_000_000 ? "compact" : "standard",
        maximumFractionDigits: value >= 1_000_000 ? 2 : 0,
    }).format(value);
}

function timeAgo(ms: number | null): string {
    if (!ms) return "never";
    const diff = Date.now() - ms;
    const sec = Math.round(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    return `${Math.round(hr / 24)}d ago`;
}

function formatDuration(ms: number | null): string {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    const sec = ms / 1000;
    if (sec < 60) return `${sec.toFixed(1)}s`;
    return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

export default function DashboardIndex() {
    const params = useParams();
    const locale = (params?.locale as string) ?? "en";

    const [overview, setOverview] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const res = await getDashboardOverviewAction();
            if (cancelled) return;
            if (res.success) {
                setOverview(res.data);
                setError(null);
            } else {
                setError(res.error);
            }
            setLoading(false);
        };
        load();

        // Auto-refresh when a sync finishes — dispatched by SyncQueueBar.
        const onSyncCompleted = () => load();
        window.addEventListener("sync-completed", onSyncCompleted);
        return () => {
            cancelled = true;
            window.removeEventListener("sync-completed", onSyncCompleted);
        };
    }, []);

    if (loading && !overview) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-muted-foreground" size={28} />
            </div>
        );
    }

    if (error || !overview) {
        return (
            <div className="p-8 max-w-md mx-auto">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Failed to load overview: {error ?? "unknown error"}
                </div>
            </div>
        );
    }

    const { stats, leads, lastSync, syncQueue, homeSections } = overview;
    const totalJobsLive = syncQueue.active + syncQueue.queued + syncQueue.paused;
    const totalTagged = Object.values(homeSections).reduce((s, n) => s + n, 0);

    return (
        <div className="p-4 md:p-8 max-w-[1800px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">Overview</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time snapshot of your portfolio, leads, and pipeline activity.
                    </p>
                </div>
                <Link
                    href={`/${locale}/strategy`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                    How this system works <ArrowRight size={12} />
                </Link>
            </div>

            {/* BENTO GRID — 6 rows × 4 cols on desktop, auto-stacked on mobile. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(120px,auto)] gap-4">

                {/* Portfolio Value — hero tile, 2x2 on desktop */}
                <Tile className="sm:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-blue-100">Portfolio value</p>
                            <p className="text-5xl font-bold mt-2 tabular-nums">{formatCurrency(stats.totalValue)}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Wallet size={18} />
                        </div>
                    </div>
                    <div className="mt-auto pt-6 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-[11px] text-blue-100 uppercase tracking-wider">Avg. price</p>
                            <p className="font-bold text-lg mt-0.5 tabular-nums">{formatCurrency(stats.avgPrice)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] text-blue-100 uppercase tracking-wider">Active listings</p>
                            <p className="font-bold text-lg mt-0.5 tabular-nums">{stats.active.toLocaleString()}</p>
                        </div>
                    </div>
                </Tile>

                {/* Total Properties */}
                <Tile href={`/${locale}/dashboard/properties`}>
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total properties</p>
                        <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                            <Building2 size={14} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{stats.total.toLocaleString()}</p>
                    {stats.archived > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                            <Archive size={10} className="inline mr-1" />
                            {stats.archived.toLocaleString()} archived
                        </p>
                    )}
                </Tile>

                {/* Active Leads */}
                <Tile href={`/${locale}/dashboard/crm`} tone="emerald">
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active leads</p>
                        <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                            <Users size={14} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold tabular-nums">{leads.total.toLocaleString()}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Captured from saved searches</p>
                </Tile>

                {/* Sync Queue — current activity */}
                <Tile href={`/${locale}/dashboard/sync-health`} tone={syncQueue.errored24h > 0 ? "rose" : syncQueue.active > 0 ? "blue" : "default"}>
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sync pipeline</p>
                        <div className={`p-1.5 rounded-md ${syncQueue.active > 0 ? "bg-blue-100 dark:bg-blue-950/50 text-blue-600 animate-pulse" : syncQueue.errored24h > 0 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600"}`}>
                            <Activity size={14} />
                        </div>
                    </div>
                    {totalJobsLive > 0 ? (
                        <>
                            <p className="text-3xl font-bold tabular-nums">{totalJobsLive}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                {syncQueue.active > 0 && `${syncQueue.active} running`}
                                {syncQueue.queued > 0 && `${syncQueue.active > 0 ? " · " : ""}${syncQueue.queued} queued`}
                                {syncQueue.paused > 0 && ` · ${syncQueue.paused} paused`}
                            </p>
                        </>
                    ) : syncQueue.errored24h > 0 ? (
                        <>
                            <p className="text-3xl font-bold text-rose-600 tabular-nums">{syncQueue.errored24h}</p>
                            <p className="text-[11px] text-rose-600 mt-1 inline-flex items-center gap-1">
                                <AlertTriangle size={10} /> errored in last 24h
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-3xl font-bold text-emerald-600">All clear</p>
                            <p className="text-[11px] text-muted-foreground mt-1">No jobs running right now</p>
                        </>
                    )}
                </Tile>

                {/* Last Sync Run — wide tile */}
                <Tile className="sm:col-span-2 lg:col-span-2" href={`/${locale}/dashboard/sync-health`}>
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Last MLS sync</p>
                        {lastSync.status === "success" ? (
                            <div className="p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                                <CheckCircle2 size={14} />
                            </div>
                        ) : lastSync.status === "error" ? (
                            <div className="p-1.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-600">
                                <XCircle size={14} />
                            </div>
                        ) : (
                            <div className="p-1.5 rounded-md bg-muted text-muted-foreground">
                                <Clock size={14} />
                            </div>
                        )}
                    </div>
                    <div className="flex items-baseline gap-6 flex-wrap">
                        <div>
                            <p className="text-2xl font-bold">{timeAgo(lastSync.at)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                {lastSync.at ? new Date(lastSync.at).toLocaleString() : "No cron runs yet"}
                            </p>
                        </div>
                        {lastSync.total !== null && (
                            <div>
                                <p className="text-sm font-bold tabular-nums">{lastSync.total.toLocaleString()} props</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">in {formatDuration(lastSync.durationMs)}</p>
                            </div>
                        )}
                    </div>
                </Tile>

                {/* Home sections distribution — wide tile */}
                <Tile className="sm:col-span-2 lg:col-span-2" href={`/${locale}/dashboard/properties`}>
                    <div className="flex items-start justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Home section tags</p>
                        <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-950/50 text-purple-600">
                            <TrendingUp size={14} />
                        </div>
                    </div>
                    {totalTagged === 0 ? (
                        <div>
                            <p className="text-sm text-muted-foreground">No properties tagged yet.</p>
                            <p className="text-[11px] text-muted-foreground mt-1">
                                Open any property in the dashboard and click the tag icon to curate your home.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-5 gap-2">
                            <TagBucket label="Featured" count={homeSections.featured} icon={<Star size={12} />} tone="blue" />
                            <TagBucket label="Luxury" count={homeSections.luxury} icon={<Gem size={12} />} tone="amber" />
                            <TagBucket label="Waterfront" count={homeSections.waterfront} icon={<Waves size={12} />} tone="cyan" />
                            <TagBucket label="New Today" count={homeSections["new-today"]} icon={<Sparkles size={12} />} tone="emerald" />
                            <TagBucket label="Investor" count={homeSections["investor-deals"]} icon={<TrendingUp size={12} />} tone="purple" />
                        </div>
                    )}
                </Tile>

                {/* Paused syncs warning (only shown when > 0) */}
                {syncQueue.paused > 0 && (
                    <Tile className="sm:col-span-2 lg:col-span-2" tone="amber" href={`/${locale}/dashboard/sync-health`}>
                        <div className="flex items-center gap-3">
                            <PauseCircle size={20} className="text-amber-600 shrink-0" />
                            <div>
                                <p className="font-semibold text-sm">
                                    {syncQueue.paused} paused {syncQueue.paused === 1 ? "sync job" : "sync jobs"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Resume them from the bottom sync queue bar to continue processing.
                                </p>
                            </div>
                        </div>
                    </Tile>
                )}

            </div>
        </div>
    );
}

/* ---------- Reusable tile components ---------- */

type TileTone = "default" | "blue" | "emerald" | "rose" | "amber";

function Tile({
    children,
    href,
    className = "",
    tone = "default",
}: {
    children: React.ReactNode;
    href?: string;
    className?: string;
    tone?: TileTone;
}) {
    const toneClass: Record<TileTone, string> = {
        default: "bg-card border-border",
        blue: "bg-card border-blue-200 dark:border-blue-900",
        emerald: "bg-card border-emerald-200 dark:border-emerald-900",
        rose: "bg-card border-rose-200 dark:border-rose-900",
        amber: "bg-card border-amber-200 dark:border-amber-900",
    };
    const inner = (
        <div className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md flex flex-col h-full ${toneClass[tone]} ${className}`}>
            {children}
        </div>
    );
    if (href) {
        return (
            <Link href={href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                {inner}
            </Link>
        );
    }
    return inner;
}

function TagBucket({
    label, count, icon, tone,
}: {
    label: string;
    count: number;
    icon: React.ReactNode;
    tone: "blue" | "amber" | "cyan" | "emerald" | "purple";
}) {
    const colors: Record<string, string> = {
        blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900",
        amber: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900",
        cyan: "bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900",
        emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900",
        purple: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900",
    };
    return (
        <div className={`rounded-lg border p-2 ${colors[tone]} text-center`}>
            <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">
                {icon} <span className="truncate">{label}</span>
            </div>
            <p className="text-xl font-bold tabular-nums">{count}</p>
        </div>
    );
}
