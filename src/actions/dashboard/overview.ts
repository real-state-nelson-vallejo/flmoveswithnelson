"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase/admin";
import { getPropertyStatsAction, type PropertyStatsSummary } from "@/actions/property/stats";

export interface DashboardOverview {
    stats: PropertyStatsSummary;
    leads: {
        total: number;
    };
    lastSync: {
        at: number | null;
        durationMs: number | null;
        total: number | null;
        status: "success" | "error" | "running" | null;
    };
    syncQueue: {
        active: number;     // processing + pending
        queued: number;     // waiting in line behind another job
        paused: number;
        errored24h: number; // errored in the last 24h (health signal)
    };
    homeSections: {
        featured: number;
        luxury: number;
        waterfront: number;
        "new-today": number;
        "investor-deals": number;
    };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const loadOverview = unstable_cache(
    async (): Promise<DashboardOverview> => {
        const statsRes = await getPropertyStatsAction();
        const stats: PropertyStatsSummary = statsRes.success ? statsRes.stats : {
            total: 0, active: 0, archived: 0, totalValue: 0, avgPrice: 0, updatedAt: null,
        };

        // Leads — simple count aggregation, independent of schema.
        let leadsTotal = 0;
        try {
            const leadsAgg = await adminDb.collection("leads").count().get();
            leadsTotal = leadsAgg.data().count ?? 0;
        } catch (err) {
            console.warn("[overview] leads count failed:", err);
        }

        // Most recent syncRuns entry (cron audit log).
        let lastSync: DashboardOverview["lastSync"] = {
            at: null, durationMs: null, total: null, status: null,
        };
        try {
            const lastRunSnap = await adminDb.collection("syncRuns")
                .orderBy("startedAt", "desc")
                .limit(1)
                .get();
            const doc = lastRunSnap.docs[0];
            if (doc) {
                const data = doc.data();
                lastSync = {
                    at: data.startedAt?.toMillis?.() ?? null,
                    durationMs: data.durationMs ?? null,
                    total: data.total ?? null,
                    status: (data.status ?? null) as DashboardOverview["lastSync"]["status"],
                };
            }
        } catch (err) {
            console.warn("[overview] lastSync read failed:", err);
        }

        // Sync queue snapshot — parallel count queries, cheap.
        const [activeAgg, queuedAgg, pausedAgg, erroredAgg] = await Promise.all([
            adminDb.collection("syncJobs").where("status", "in", ["pending", "processing"]).count().get().catch(() => null),
            adminDb.collection("syncJobs").where("status", "==", "queued").count().get().catch(() => null),
            adminDb.collection("syncJobs").where("status", "==", "paused").count().get().catch(() => null),
            adminDb.collection("syncJobs")
                .where("status", "==", "error")
                .where("finishedAt", ">=", new Date(Date.now() - DAY_MS))
                .count().get().catch(() => null),
        ]);

        const syncQueue: DashboardOverview["syncQueue"] = {
            active: activeAgg?.data().count ?? 0,
            queued: queuedAgg?.data().count ?? 0,
            paused: pausedAgg?.data().count ?? 0,
            errored24h: erroredAgg?.data().count ?? 0,
        };

        // Home section distribution — 5 parallel count queries, one per section.
        // Each query uses the (homeSections CONTAINS, archived ASC, createdAt DESC) index.
        const sectionLabels = ["featured", "luxury", "waterfront", "new-today", "investor-deals"] as const;
        const sectionCounts = await Promise.all(sectionLabels.map(async (s) => {
            try {
                const agg = await adminDb.collection("properties")
                    .where("homeSections", "array-contains", s)
                    .where("archived", "==", false)
                    .count().get();
                return [s, agg.data().count ?? 0] as const;
            } catch {
                return [s, 0] as const;
            }
        }));

        const homeSections = Object.fromEntries(sectionCounts) as DashboardOverview["homeSections"];

        return { stats, leads: { total: leadsTotal }, lastSync, syncQueue, homeSections };
    },
    ["dashboard-overview"],
    { revalidate: 60, tags: ["dashboard-overview", "property-stats", "home-featured"] },
);

export async function getDashboardOverviewAction(): Promise<{ success: true; data: DashboardOverview } | { success: false; error: string }> {
    try {
        const data = await loadOverview();
        return { success: true, data };
    } catch (error: any) {
        console.error("Error loading dashboard overview:", error);
        return { success: false, error: error.message || "Failed to load overview" };
    }
}
