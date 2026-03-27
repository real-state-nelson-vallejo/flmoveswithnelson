import { BridgePropertyRepository } from '../infrastructure/BridgePropertyRepository';
import { FirestorePropertyRepository } from '../infrastructure/FirestorePropertyRepository';
import { VectorizePropertyService } from './VectorizePropertyService';
import { DispatchSavedSearchAlerts } from '@/backend/crm/application/DispatchSavedSearchAlerts';
import { FirestoreSavedSearchRepository } from '@/backend/crm/infrastructure/FirestoreSavedSearchRepository';
import { Property } from '../domain/Property';

export class SyncBridgeProperties {
    constructor(
        private readonly bridgeRepo = new BridgePropertyRepository(),
        private readonly firestoreRepo = new FirestorePropertyRepository(),
        private readonly vectorService = new VectorizePropertyService(),
        private readonly dispatchService = new DispatchSavedSearchAlerts(new FirestoreSavedSearchRepository())
    ) {}

    /**
    /**
     * Synchronizes active properties via advanced MLS OData filters.
     */
    async syncProperties(filters: { zone?: string; minBeds?: number; maxPrice?: number; propertyType?: string; agentId?: string; officeId?: string }, limit: number = 50, skip: number = 0): Promise<{ synced: number }> {
        console.log(`[SyncBridgeProperties] Starting sync with filters:`, filters);
        
        // 1. Fetch from Bridge
        const bridgeItems = await this.bridgeRepo.getActiveProperties(filters, limit, skip);
        let syncedCount = 0;
        const newlyDiscoveredOpportunities: Property[] = [];

        for (const item of bridgeItems) {
            const externalId = item.externalId;
            let propertyToSave = item.property;
            let isNewOrPriceDrop = false;

            // 2. Check if it already exists to avoid duplicates
            const existing = await this.firestoreRepo.findByExternalId(externalId);
            
            if (existing) {
                // If the new list price is lower, it's a price drop opportunity
                if ((propertyToSave.ListPrice || 0) < (existing.ListPrice || 0)) {
                    isNewOrPriceDrop = true;
                }
                
                // Update existing (e.g. price and status changes)
                const updates: any = {
                    ListPrice: propertyToSave.ListPrice,
                    StandardStatus: propertyToSave.StandardStatus,
                    Media: propertyToSave.Media,
                    PublicRemarks: propertyToSave.PublicRemarks
                };
                if (propertyToSave.ListAgentMlsId !== undefined) updates.ListAgentMlsId = propertyToSave.ListAgentMlsId;
                if (propertyToSave.ListOfficeMlsId !== undefined) updates.ListOfficeMlsId = propertyToSave.ListOfficeMlsId;
                
                existing.update(updates);
                propertyToSave = existing;
            } else {
                isNewOrPriceDrop = true;
            }

            // 3. Save to primary database (Firestore)
            await this.firestoreRepo.save(propertyToSave);

            // 4. Update the AI Vector DB shadow copy (Graceful Fail)
            try {
                await this.vectorService.execute(propertyToSave);
            } catch (vecErr: any) {
                console.warn(`[SyncBridgeProperties] Vectorization skipped for ${externalId} due to API error:`, vecErr.message);
            }
            
            if (isNewOrPriceDrop) {
                newlyDiscoveredOpportunities.push(propertyToSave);
            }
            
            syncedCount++;
        }

        if (newlyDiscoveredOpportunities.length > 0) {
            console.log(`[SyncBridgeProperties] Found ${newlyDiscoveredOpportunities.length} new or reduced properties! Dispatching CRM checks...`);
            await this.dispatchService.execute(newlyDiscoveredOpportunities);
        }

        console.log(`[SyncBridgeProperties] Finished sync with filters: ${JSON.stringify(filters)}. Total synced: ${syncedCount}`);
        return { synced: syncedCount };
    }

    /**
     * Synchronizes properties that have been modified since a certain date.
     * Prevents system overload by downloading only delta updates.
     */
    async syncDelta(sinceDate: Date, limit: number = 50): Promise<{ synced: number }> {
        console.log(`[SyncBridgeProperties] Starting delta sync since: ${sinceDate.toISOString()}`);
        const bridgeItems = await this.bridgeRepo.getModifiedPropertiesSince(sinceDate, limit, 0);
        let syncedCount = 0;
        const newlyDiscoveredOpportunities: Property[] = [];

        for (const item of bridgeItems) {
            const externalId = item.externalId;
            let propertyToSave = item.property;
            let isNewOrPriceDrop = false;

            const existing = await this.firestoreRepo.findByExternalId(externalId);
            if (existing) {
                if ((propertyToSave.ListPrice || 0) < (existing.ListPrice || 0)) {
                    isNewOrPriceDrop = true;
                }
                const updates: any = {
                    ListPrice: propertyToSave.ListPrice,
                    StandardStatus: propertyToSave.StandardStatus,
                    Media: propertyToSave.Media,
                    PublicRemarks: propertyToSave.PublicRemarks
                };
                if (propertyToSave.ListAgentMlsId !== undefined) updates.ListAgentMlsId = propertyToSave.ListAgentMlsId;
                if (propertyToSave.ListOfficeMlsId !== undefined) updates.ListOfficeMlsId = propertyToSave.ListOfficeMlsId;
                
                existing.update(updates);
                propertyToSave = existing;
            } else {
                isNewOrPriceDrop = true;
            }

            await this.firestoreRepo.save(propertyToSave);
            
            try {
                await this.vectorService.execute(propertyToSave);
            } catch (vecErr: any) {
                console.warn(`[SyncBridgeProperties] Vectorization skipped for ${externalId} due to API error:`, vecErr.message);
            }
            
            if (isNewOrPriceDrop) {
                newlyDiscoveredOpportunities.push(propertyToSave);
            }
            
            syncedCount++;
        }

        if (newlyDiscoveredOpportunities.length > 0) {
            console.log(`[SyncBridgeProperties] Found ${newlyDiscoveredOpportunities.length} new or reduced properties! Dispatching CRM checks...`);
            await this.dispatchService.execute(newlyDiscoveredOpportunities);
        }

        console.log(`[SyncBridgeProperties] Finished delta sync. Total synced: ${syncedCount}`);
        return { synced: syncedCount };
    }
}
