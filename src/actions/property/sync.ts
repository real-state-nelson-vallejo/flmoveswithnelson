"use server";

import { SyncBridgeProperties } from "@/backend/property/application/SyncBridgeProperties";
import type { AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

const syncBridgePropertiesUseCase = new SyncBridgeProperties();

/**
 * Legacy server action — maintained for the existing SyncMLSModal "one-shot" path.
 * For the async orchestrated pipeline (Fase 2.1) see /api/sync/run which enqueues
 * a job processed by a Firebase Function worker.
 */
export async function syncPropertiesAction(
    filters: AdvancedPropertyFilters,
    limit: number = 20,
    skip: number = 0
) {
    try {
        if (!process.env.BRIDGE_SERVER_TOKEN) {
            throw new Error("BRIDGE_SERVER_TOKEN is not configured. Go to settings or .env to add it.");
        }

        const result = await syncBridgePropertiesUseCase.syncProperties(filters, limit, skip);
        return { success: true as const, syncedCount: result.synced };
    } catch (error: any) {
        console.error("Error syncing properties from MLS:", error);
        return {
            success: false as const,
            error: error.message || "An unexpected error occurred while syncing properties."
        };
    }
}
