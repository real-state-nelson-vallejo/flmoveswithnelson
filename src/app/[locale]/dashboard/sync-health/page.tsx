"use client";

import { useEffect, useState } from "react";
import { getRecentSyncRunsAction, SyncRunSummary } from "@/actions/sync/actions";
import { Loader2, CheckCircle2, XCircle, Clock, RefreshCw, Activity } from "lucide-react";

function timeAgo(ms: number): string {
    const diff = Date.now() - ms;
    const sec = Math.round(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.round(hr / 24);
    return `${days}d ago`;
}

function formatDuration(ms: number | null): string {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms}ms`;
    const sec = ms / 1000;
    if (sec < 60) return `${sec.toFixed(1)}s`;
    return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

function StatusBadge({ status }: { status: SyncRunSummary['status'] }) {
    if (status === 'success') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                <CheckCircle2 size={12} /> Success
            </span>
        );
    }
    if (status === 'error') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-950/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                <XCircle size={12} /> Error
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
            <Loader2 size={12} className="animate-spin" /> Running
        </span>
    );
}

export default function SyncHealthPage() {
    const [runs, setRuns] = useState<SyncRunSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        const res = await getRecentSyncRunsAction(20);
        if (res.success) {
            setRuns(res.runs);
        } else {
            setError(res.error);
        }
        setLoading(false);
    };

    useEffect(() => {
        load();
    }, []);

    const lastSuccess = runs.find(r => r.status === 'success');

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            <header className="flex items-start justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <Activity size={14} /> MLS Pipeline
                    </div>
                    <h1 className="text-2xl font-bold">Sync Health</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {lastSuccess
                            ? `Last successful sync ${timeAgo(lastSuccess.startedAt)} — ${lastSuccess.total ?? 0} properties processed.`
                            : 'No successful sync runs recorded yet.'}
                    </p>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </header>

            {error && (
                <div className="mb-4 p-4 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 text-sm text-red-700 dark:text-red-400">
                    {error}
                </div>
            )}

            {loading && runs.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                    <Loader2 className="animate-spin" size={24} />
                </div>
            ) : runs.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-10 text-center">
                    <Clock size={28} className="mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                        No sync runs yet. The scheduled cron will create the first record, or trigger a manual sync from Properties.
                    </p>
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase tracking-wider">
                            <tr>
                                <th className="text-left font-semibold px-4 py-3">Status</th>
                                <th className="text-left font-semibold px-4 py-3">Started</th>
                                <th className="text-left font-semibold px-4 py-3">Source</th>
                                <th className="text-right font-semibold px-4 py-3">Delta</th>
                                <th className="text-right font-semibold px-4 py-3">Exclusive</th>
                                <th className="text-right font-semibold px-4 py-3">Total</th>
                                <th className="text-right font-semibold px-4 py-3">Duration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {runs.map((r) => (
                                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <StatusBadge status={r.status} />
                                        {r.error && (
                                            <div className="mt-1 text-[11px] text-red-600 dark:text-red-400 line-clamp-2 max-w-[260px]" title={r.error}>
                                                {r.error}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                        <div>{timeAgo(r.startedAt)}</div>
                                        <div className="text-[11px] opacity-70">{new Date(r.startedAt).toLocaleString()}</div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground capitalize">{r.trigger} · {r.source}</td>
                                    <td className="px-4 py-3 text-right font-mono">{r.deltaSynced ?? '—'}</td>
                                    <td className="px-4 py-3 text-right font-mono">{r.exclusiveSynced ?? '—'}</td>
                                    <td className="px-4 py-3 text-right font-semibold">{r.total ?? '—'}</td>
                                    <td className="px-4 py-3 text-right text-muted-foreground">{formatDuration(r.durationMs)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
