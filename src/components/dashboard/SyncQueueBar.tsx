"use client";

import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot, query, where, orderBy, limit as fbLimit, Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { db, auth } from "@/lib/firebase/client";
import { useAuth } from "@/context/AuthContext";
import { ChevronDown, ChevronUp, Pause, Play, CheckCircle2, Loader2, XCircle, Clock, Activity } from "lucide-react";

// Keyed by error message so we don't spam the same toast repeatedly.
const shownErrorMessages = new Set<string>();
function showSnapshotError(source: string, err: Error) {
    console.warn(`[SyncQueueBar] ${source} snapshot error:`, err.message);
    const key = `${source}:${err.message}`;
    if (shownErrorMessages.has(key)) return;
    shownErrorMessages.add(key);
    toast.error(`No se puede observar el sync (${source})`, {
        description: err.message,
        duration: 8000,
    });
}

interface SyncJobDoc {
    id: string;
    label?: string;
    status: "pending" | "queued" | "processing" | "paused" | "done" | "error";
    total?: number | null;
    processed?: number;
    added?: number;
    updated?: number;
    priceDrops?: number;
    error?: string | null;
    startedAt?: Timestamp;
    finishedAt?: Timestamp;
    parentJobId?: string;
    isParent?: boolean;
}

const ACTIVE_STATUSES: Array<SyncJobDoc["status"]> = ["pending", "queued", "processing", "paused"];

function statusLabel(s: SyncJobDoc["status"]): string {
    switch (s) {
        case "pending": return "En cola";
        case "queued": return "En cola";
        case "processing": return "Procesando";
        case "paused": return "Pausado";
        case "done": return "Completado";
        case "error": return "Error";
    }
}

function statusIcon(s: SyncJobDoc["status"]) {
    switch (s) {
        case "processing": return <Loader2 size={14} className="animate-spin text-blue-500" />;
        case "paused": return <Pause size={14} className="text-amber-500" />;
        case "done": return <CheckCircle2 size={14} className="text-emerald-500" />;
        case "error": return <XCircle size={14} className="text-rose-500" />;
        default: return <Clock size={14} className="text-slate-400" />;
    }
}

export function SyncQueueBar() {
    const { user, isAdmin } = useAuth();
    const [active, setActive] = useState<SyncJobDoc[]>([]);
    const [recentDone, setRecentDone] = useState<SyncJobDoc[]>([]);
    const [expanded, setExpanded] = useState(false);
    const [busyJobId, setBusyJobId] = useState<string | null>(null);

    // Tracks which job IDs have already fired the 'sync-completed' event, so a
    // re-subscribe or remount doesn't re-trigger the toast + refresh every time.
    const completedDispatchedRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!user || !isAdmin) return;

        const activeQuery = query(
            collection(db, "syncJobs"),
            where("status", "in", ACTIVE_STATUSES),
            orderBy("startedAt", "desc")
        );
        const unsubActive = onSnapshot(activeQuery, (snap) => {
            const items: SyncJobDoc[] = snap.docs
                .map((d) => ({ id: d.id, ...(d.data() as Omit<SyncJobDoc, "id">) }))
                .filter((j) => !j.isParent);
            setActive(items);
        }, (err) => showSnapshotError("active", err));

        const doneQuery = query(
            collection(db, "syncJobs"),
            where("status", "==", "done"),
            orderBy("finishedAt", "desc"),
            fbLimit(3)
        );
        const unsubDone = onSnapshot(doneQuery, (snap) => {
            const items: SyncJobDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SyncJobDoc, "id">) }));

            // Detect newly-completed jobs (not yet announced) and fire a global event
            // that /dashboard/properties listens to for auto-refresh.
            for (const job of items) {
                if (completedDispatchedRef.current.has(job.id)) continue;
                // Skip jobs finished long ago (> 5 min) — those are historical on mount.
                const finishedMs = job.finishedAt?.toMillis?.() ?? 0;
                if (finishedMs && Date.now() - finishedMs > 5 * 60 * 1000) {
                    completedDispatchedRef.current.add(job.id);
                    continue;
                }
                completedDispatchedRef.current.add(job.id);
                window.dispatchEvent(new CustomEvent("sync-completed", {
                    detail: {
                        jobId: job.id,
                        label: job.label ?? "Sync",
                        added: job.added ?? 0,
                        updated: job.updated ?? 0,
                        total: job.total ?? 0,
                    },
                }));
            }

            setRecentDone(items);
        }, (err) => showSnapshotError("done", err));

        return () => { unsubActive(); unsubDone(); };
    }, [user, isAdmin]);

    if (!user || !isAdmin) return null;
    if (active.length === 0 && recentDone.length === 0) return null;

    const jobAction = async (jobId: string, action: "pause" | "resume") => {
        setBusyJobId(jobId);
        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) throw new Error("No auth token");
            const res = await fetch(`/api/sync/${action}`, {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ jobId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                console.error(`[SyncQueueBar] ${action} failed:`, err);
            }
        } catch (e) {
            console.error(`[SyncQueueBar] ${action} exception:`, e);
        } finally {
            setBusyJobId(null);
        }
    };

    const totalActiveCount = active.length;
    const processing = active.find((j) => j.status === "processing");
    const summary = processing
        ? `${processing.label || "Sync"} · ${progressPct(processing)}%`
        : `${totalActiveCount} job${totalActiveCount > 1 ? "s" : ""} en cola`;

    return (
        <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur z-40 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.4)]">
            {/* Expanded details live ABOVE the trigger so they don't fall off-screen */}
            {expanded && (
                <div className="max-h-[60vh] overflow-auto px-4 md:px-8 py-3 space-y-2 border-b border-border/60">
                    {active.length > 0 && (
                        <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            En curso
                        </div>
                    )}
                    {active.map((job) => (
                        <div key={job.id} className="flex items-start sm:items-center gap-3 py-2 text-sm">
                            <div className="shrink-0 pt-0.5 sm:pt-0">{statusIcon(job.status)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{job.label || "Sync"}</div>
                                <div className="text-xs text-muted-foreground tabular-nums">
                                    {statusLabel(job.status)} · {job.processed ?? 0}/{job.total ?? "?"}
                                    {(job.added ?? 0) > 0 && ` · +${job.added} nuevas`}
                                    {(job.priceDrops ?? 0) > 0 && ` · ${job.priceDrops} price-drops`}
                                </div>
                                {job.total && job.total > 0 && (
                                    <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden max-w-md">
                                        <div
                                            className={`h-full transition-all ${job.status === "paused" ? "bg-amber-500" : "bg-blue-500"}`}
                                            style={{ width: `${progressPct(job)}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {job.status === "processing" || job.status === "pending" || job.status === "queued" ? (
                                    <button
                                        type="button"
                                        onClick={() => jobAction(job.id, "pause")}
                                        disabled={busyJobId === job.id || job.status === "queued"}
                                        className="p-1.5 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-40"
                                        title={job.status === "queued" ? "En cola — no se puede pausar todavía" : "Pausar"}
                                    >
                                        <Pause size={14} />
                                    </button>
                                ) : job.status === "paused" ? (
                                    <button
                                        type="button"
                                        onClick={() => jobAction(job.id, "resume")}
                                        disabled={busyJobId === job.id}
                                        className="p-1.5 rounded-md hover:bg-accent text-blue-600 disabled:opacity-40"
                                        title="Reanudar"
                                    >
                                        <Play size={14} />
                                    </button>
                                ) : null}
                            </div>
                        </div>
                    ))}
                    {recentDone.length > 0 && (
                        <div className={active.length > 0 ? "pt-2 border-t border-border/50" : ""}>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                Últimos completados
                            </div>
                            {recentDone.map((job) => (
                                <div key={job.id} className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
                                    {statusIcon(job.status)}
                                    <span className="truncate flex-1">{job.label || "Sync"}</span>
                                    <span className="tabular-nums shrink-0">
                                        {job.total ?? 0} props
                                        {(job.added ?? 0) > 0 && ` · +${job.added} nuevas`}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Trigger bar (always anchored to the bottom) */}
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-4 md:px-8 py-2.5 text-left hover:bg-accent/40 transition-colors"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Activity size={16} className="text-blue-500 shrink-0" />
                    <span className="text-sm font-medium truncate">
                        {totalActiveCount > 0 ? summary : "Sync completado"}
                    </span>
                    {processing && (
                        <>
                            <span className="text-xs text-muted-foreground tabular-nums shrink-0 hidden sm:inline">
                                {processing.processed ?? 0}/{processing.total ?? "?"}
                            </span>
                            {/* Thin progress track inline on the trigger bar */}
                            <div className="hidden md:block flex-1 max-w-[240px] h-1 bg-muted rounded-full overflow-hidden ml-2">
                                <div
                                    className="h-full bg-blue-500 transition-all"
                                    style={{ width: `${progressPct(processing)}%` }}
                                />
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground shrink-0">
                    <span className="text-xs hidden sm:inline">Sync Queue</span>
                    {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
            </button>
        </div>
    );
}

function progressPct(job: SyncJobDoc): number {
    if (!job.total || job.total === 0) return 0;
    return Math.min(100, Math.round(((job.processed ?? 0) / job.total) * 100));
}
