"use client";

import { useEffect, useState } from "react";
import { PropertyDTO } from "@/types/property";
import { Building2, TrendingUp, DollarSign, Activity } from "lucide-react";
import { getPropertyStatsAction, PropertyStatsSummary } from "@/actions/property/stats";

interface PropertyStatsProps {
    /**
     * Current-page properties (fallback for the first render before aggregated
     * stats are fetched). With paginated listings this is the current page only —
     * the real totals come from the `stats/properties` doc updated by the
     * onPropertyWrite Firebase Function trigger.
     */
    properties: PropertyDTO[];
}

export function PropertyStats({ properties }: PropertyStatsProps) {
    const [stats, setStats] = useState<PropertyStatsSummary | null>(null);

    useEffect(() => {
        let cancelled = false;
        const loadStats = async () => {
            const res = await getPropertyStatsAction();
            if (!cancelled && res.success) setStats(res.stats);
        };
        loadStats();
        // Refetch whenever the page receives a sync-completed event so the tiles stay fresh.
        const onSyncCompleted = () => loadStats();
        window.addEventListener("sync-completed", onSyncCompleted);
        return () => {
            cancelled = true;
            window.removeEventListener("sync-completed", onSyncCompleted);
        };
    }, []);

    const totalProperties = stats?.total ?? properties.length;
    const activeProperties = stats?.active ?? properties.filter(p => p.StandardStatus === 'Active').length;
    const totalValue = stats?.totalValue ?? properties.reduce((sum, p) => sum + p.ListPrice, 0);
    const avgPrice = stats?.avgPrice ?? (totalProperties > 0 ? totalValue / totalProperties : 0);

    const tiles = [
        {
            label: "Total Properties",
            value: totalProperties.toLocaleString(),
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Active Listings",
            value: activeProperties.toLocaleString(),
            icon: Activity,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
        },
        {
            label: "Portfolio Value",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(totalValue),
            icon: DollarSign,
            color: "text-violet-600",
            bg: "bg-violet-50",
        },
        {
            label: "Avg. Price",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: "compact", maximumFractionDigits: 1 }).format(avgPrice),
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-50",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {tiles.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className="bg-white rounded-xl border border-slate-200 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                            <Icon size={24} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
