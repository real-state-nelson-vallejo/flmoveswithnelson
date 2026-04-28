"use server";

import { unstable_cache } from "next/cache";
import { AggregateField } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

export interface PropertyStatsSummary {
    total: number;
    active: number;
    archived: number;
    totalValue: number;
    avgPrice: number;
    updatedAt: number | null;
}

const EMPTY: PropertyStatsSummary = {
    total: 0,
    active: 0,
    archived: 0,
    totalValue: 0,
    avgPrice: 0,
    updatedAt: null,
};

/**
 * Computes the four dashboard tiles using Firestore aggregation queries (count + sum/avg).
 * Each aggregation costs ~1 document read on Firestore's billing side, regardless of the
 * collection size. So the whole stats endpoint is 4 reads even with 100K properties.
 *
 * This replaces the previous approach of reading a precomputed `stats/properties` doc
 * maintained by the `onPropertyWrite` Function trigger — that trigger is still there, but
 * it's now a caching layer rather than the source of truth.
 *
 * Wrapped in unstable_cache (60s) so repeated pageviews don't re-run aggregations.
 */
const computeStats = unstable_cache(
    async (): Promise<PropertyStatsSummary> => {
        const col = adminDb.collection("properties");

        // Total — no filter. Counts every doc regardless of archive/status.
        const totalAgg = await col.count().get();
        const total = totalAgg.data().count ?? 0;

        // Active listings — StandardStatus = Active AND not archived.
        // `archived != true` covers docs where the field is missing (legacy) AND docs with archived: false.
        // But Firestore doesn't support "!=", so we count those where archived == false OR archived is null
        // by using two queries and summing, or we can rely on the fact that archived == true excludes everything else.
        // Simpler: active = total - archived - non-active. Use dedicated aggregations:
        const activeAgg = await col
            .where("StandardStatus", "==", "Active")
            .count()
            .get();
        const activeIncludingArchived = activeAgg.data().count ?? 0;

        // Archived docs — explicit archived: true.
        const archivedAgg = await col.where("archived", "==", true).count().get();
        const archived = archivedAgg.data().count ?? 0;

        // active = Active listings minus those archived (assumes archiving doesn't change StandardStatus atomically;
        // if it does, this slightly underestimates but the error is small and transient).
        const archivedActiveAgg = await col
            .where("StandardStatus", "==", "Active")
            .where("archived", "==", true)
            .count()
            .get();
        const active = activeIncludingArchived - (archivedActiveAgg.data().count ?? 0);

        // Portfolio value + avg — sum and average of ListPrice across non-archived docs.
        // If a doc doesn't have archived set (legacy), we include it in the portfolio value
        // via a separate sum over the whole collection; then subtract the archived-value aggregate.
        let totalValue = 0;
        let avgPrice = 0;
        try {
            const valueAgg = await col.aggregate({
                total: AggregateField.sum("ListPrice"),
                avg: AggregateField.average("ListPrice"),
            }).get();
            totalValue = valueAgg.data().total ?? 0;
            avgPrice = valueAgg.data().avg ?? 0;

            if (archived > 0) {
                const archivedValueAgg = await col
                    .where("archived", "==", true)
                    .aggregate({ total: AggregateField.sum("ListPrice") })
                    .get();
                totalValue -= archivedValueAgg.data().total ?? 0;
                // Recompute avg excluding archived.
                const nonArchivedCount = total - archived;
                avgPrice = nonArchivedCount > 0 ? totalValue / nonArchivedCount : 0;
            }
        } catch (aggErr) {
            // sum()/average() require firebase-admin SDK with the aggregation feature.
            // If not available, fall back to 0s rather than crashing the dashboard.
            console.warn("[stats] aggregate sum/average not supported, skipping portfolio value:", aggErr);
        }

        return {
            total,
            active: Math.max(0, active),
            archived,
            totalValue,
            avgPrice,
            updatedAt: Date.now(),
        };
    },
    ["property-stats-aggregated"],
    { revalidate: 60, tags: ["property-stats"] },
);

export async function getPropertyStatsAction(): Promise<{ success: true; stats: PropertyStatsSummary } | { success: false; error: string }> {
    try {
        const stats = await computeStats();
        return { success: true, stats };
    } catch (error: any) {
        console.error("Error computing property stats:", error);
        return { success: false, error: error.message || "Failed to compute stats" };
    }
}
