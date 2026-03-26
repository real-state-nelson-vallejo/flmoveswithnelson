"use server";

import { SyncBridgeProperties } from "@/backend/property/application/SyncBridgeProperties";

// Instantiate the use case which wires up the Bridge API, Firestore Repository, and AI Vector Service
const syncBridgePropertiesUseCase = new SyncBridgeProperties();

export async function syncPropertiesAction(filters: { zone?: string | undefined; minBeds?: number | undefined; maxPrice?: number | undefined; propertyType?: string | undefined }, limit: number = 20, skip: number = 0) {
    try {
        if (!process.env.BRIDGE_SERVER_TOKEN) {
             throw new Error("BRIDGE_SERVER_TOKEN is not configured. Go to settings or .env to add it.");
        }
        
        const result = await syncBridgePropertiesUseCase.syncProperties(filters, limit, skip);
        return { success: true, syncedCount: result.synced };
    } catch (error: any) {
        console.error("Error syncing properties from MLS:", error);
        return { 
            success: false, 
            error: error.message || "An unexpected error occurred while syncing properties."
        };
    }
}
