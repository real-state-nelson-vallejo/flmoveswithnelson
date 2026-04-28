"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertTriangle, Sparkles, Zap, Split, Play } from "lucide-react";
import type { AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

export type SyncMode = "quality" | "fast";

export interface SubTotal {
    label: string;
    count: number;
    estimatedMsQuality: number;
    estimatedMsFast: number;
    filters: AdvancedPropertyFilters;
}

export interface PreviewResult {
    total: number;
    estimatedMsQuality: number;
    estimatedMsFast: number;
    suggestSplit: boolean;
    splitStrategy: "counties" | "zones" | "price" | null;
    subTotals: SubTotal[] | null;
    threshold: number;
}

interface SyncEstimateBadgeProps {
    filters: AdvancedPropertyFilters;
    onConfirm: (args: { filters: AdvancedPropertyFilters; mode: SyncMode; split?: SubTotal[]; total?: number; label?: string }) => void;
    disabled?: boolean;
}

function formatDuration(ms: number): string {
    const sec = ms / 1000;
    if (sec < 60) return `${Math.round(sec)}s`;
    const min = sec / 60;
    if (min < 60) return `${Math.round(min)} min`;
    const hr = Math.floor(min / 60);
    const rem = Math.round(min % 60);
    return `${hr}h ${rem}m`;
}

function filtersKey(filters: AdvancedPropertyFilters): string {
    return JSON.stringify(filters);
}

export function SyncEstimateBadge({ filters, onConfirm, disabled = false }: SyncEstimateBadgeProps) {
    const [preview, setPreview] = useState<PreviewResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<SyncMode>("quality");

    const key = useMemo(() => filtersKey(filters), [filters]);

    useEffect(() => {
        let cancelled = false;
        setError(null);
        setLoading(true);

        const handle = setTimeout(async () => {
            try {
                const res = await fetch("/api/sync/preview", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ filters }),
                });
                const data = await res.json();
                if (cancelled) return;
                if (!res.ok) {
                    setError(data?.error || `Preview failed (${res.status})`);
                    setPreview(null);
                } else {
                    setPreview(data);
                }
            } catch (e: any) {
                if (!cancelled) setError(e.message || "Preview error");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 500);

        return () => { cancelled = true; clearTimeout(handle); };
    }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading && !preview) {
        return (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                <Loader2 size={16} className="animate-spin" />
                Calculando propiedades que coinciden…
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 p-4 text-sm text-red-700 dark:text-red-300">
                No pudimos calcular el preview: {error}
            </div>
        );
    }

    if (!preview) return null;

    const { total, estimatedMsQuality, estimatedMsFast, suggestSplit, subTotals } = preview;
    const estimatedMs = mode === "quality" ? estimatedMsQuality : estimatedMsFast;

    const severity: "green" | "amber" | "red" =
        total === 0 ? "green"
        : total < 200 ? "green"
        : total <= preview.threshold ? "amber"
        : "red";

    const severityClasses = {
        green: "border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30",
        amber: "border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/30",
        red: "border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/30",
    }[severity];

    const primaryBtnClass = {
        green: "bg-emerald-600 hover:bg-emerald-700",
        amber: "bg-amber-600 hover:bg-amber-700",
        red: "bg-rose-600 hover:bg-rose-700",
    }[severity];

    const Icon = severity === "green" ? Sparkles : severity === "amber" ? AlertTriangle : AlertTriangle;

    return (
        <div className={`rounded-2xl border ${severityClasses} p-5 space-y-4`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                    <Icon size={20} className="mt-0.5 shrink-0" />
                    <div className="min-w-0">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                            {total.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">propiedades coinciden</span>
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">
                            <span className="font-semibold">~{formatDuration(estimatedMs)}</span> procesar
                            {severity === "red" && <span className="text-rose-700 dark:text-rose-300"> — recomendado dividir</span>}
                            {severity === "amber" && <span className="text-amber-700 dark:text-amber-300"> — puede tardar, continuará en segundo plano</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 text-xs">
                    <button
                        type="button"
                        onClick={() => setMode("quality")}
                        className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${mode === "quality" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
                    >
                        <Sparkles size={12} /> Quality
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("fast")}
                        className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 transition-colors ${mode === "fast" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
                    >
                        <Zap size={12} /> Fast
                    </button>
                </div>
            </div>

            {suggestSplit && subTotals && subTotals.length > 1 && (
                <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        División sugerida ({preview.splitStrategy === "price" ? "por rango de precio" : preview.splitStrategy === "counties" ? "por county" : "por zona"})
                    </div>
                    <ul className="space-y-1.5 text-sm">
                        {subTotals.map((s) => (
                            <li key={s.label} className="flex items-center justify-between gap-4">
                                <span className="text-slate-700 dark:text-slate-200 truncate">{s.label}</span>
                                <span className="tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                    {s.count.toLocaleString()} · ~{formatDuration(mode === "quality" ? s.estimatedMsQuality : s.estimatedMsFast)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="flex items-center gap-2 justify-end flex-wrap">
                {suggestSplit && subTotals && subTotals.length > 1 ? (
                    <>
                        <button
                            type="button"
                            disabled={disabled || total === 0}
                            onClick={() => onConfirm({ filters, mode, total, label: formatLabel(filters) })}
                            className="px-4 h-10 rounded-xl text-sm font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                            Sync todo en 1 job
                        </button>
                        <button
                            type="button"
                            disabled={disabled || total === 0}
                            onClick={() => onConfirm({ filters, mode, split: subTotals, total, label: formatLabel(filters) })}
                            className={`px-5 h-10 rounded-xl text-sm font-bold text-white shadow-sm inline-flex items-center gap-2 disabled:opacity-50 ${primaryBtnClass}`}
                        >
                            <Split size={15} /> Dividir en {subTotals.length} jobs
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        disabled={disabled || total === 0}
                        onClick={() => onConfirm({ filters, mode, total, label: formatLabel(filters) })}
                        className={`px-5 h-10 rounded-xl text-sm font-bold text-white shadow-sm inline-flex items-center gap-2 disabled:opacity-50 ${primaryBtnClass}`}
                    >
                        <Play size={15} /> Sincronizar {total.toLocaleString()} · ~{formatDuration(estimatedMs)}
                    </button>
                )}
            </div>
        </div>
    );
}

function formatLabel(filters: AdvancedPropertyFilters): string {
    if (filters.zones?.length) return `Zones: ${filters.zones.join(", ")}`;
    if (filters.counties?.length) return `Counties: ${filters.counties.join(", ")}`;
    if (filters.agentId) return `Agent ${filters.agentId}`;
    if (filters.officeId) return `Office ${filters.officeId}`;
    return "Sync";
}
