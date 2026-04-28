import { BridgePropertyRepository, AdvancedPropertyFilters } from '../infrastructure/BridgePropertyRepository';
import { FirestorePropertyRepository } from '../infrastructure/FirestorePropertyRepository';
import { VectorizePropertyService } from './VectorizePropertyService';
import { DispatchSavedSearchAlerts } from '@/backend/crm/application/DispatchSavedSearchAlerts';
import { FirestoreSavedSearchRepository } from '@/backend/crm/infrastructure/FirestoreSavedSearchRepository';
import { Property } from '../domain/Property';

export interface SyncBatchStats {
    processed: number;
    added: number;
    updated: number;
    skipped: number;
    priceDrops: number;
    embedded: number;
    embeddingsSkipped: number;
    lastListingKey: string | null;
    durationMs: number;
}

export interface SyncBatchOptions {
    skipEmbeddingIfUnchanged?: boolean;
}

export class SyncBridgeProperties {
    constructor(
        private readonly bridgeRepo = new BridgePropertyRepository(),
        private readonly firestoreRepo = new FirestorePropertyRepository(),
        private readonly vectorService = new VectorizePropertyService(),
        private readonly dispatchService = new DispatchSavedSearchAlerts(new FirestoreSavedSearchRepository())
    ) {}

    /**
     * Process a single batch from Bridge. Returns detailed stats so a worker can
     * aggregate progress across many batches. Used by the async sync pipeline
     * (Fase 2.1). Does NOT handle pagination internally — caller controls `skip`.
     */
    async syncBatch(
        filters: AdvancedPropertyFilters,
        limit: number,
        skip: number,
        options: SyncBatchOptions = {}
    ): Promise<SyncBatchStats> {
        const started = Date.now();
        const bridgeItems = await this.bridgeRepo.getActiveProperties(filters, limit, skip);

        const stats: SyncBatchStats = {
            processed: 0,
            added: 0,
            updated: 0,
            skipped: 0,
            priceDrops: 0,
            embedded: 0,
            embeddingsSkipped: 0,
            lastListingKey: null,
            durationMs: 0,
        };
        const newlyDiscovered: Property[] = [];

        for (const item of bridgeItems) {
            const { externalId } = item;
            let propertyToSave = item.property;
            const incomingRemarks = propertyToSave.PublicRemarks ?? '';

            const existing = await this.firestoreRepo.findByExternalId(externalId);
            let isNewOrPriceDrop = false;
            let remarksChanged = true;

            if (existing) {
                const existingRemarks = existing.PublicRemarks ?? '';
                remarksChanged = existingRemarks !== incomingRemarks;

                if ((propertyToSave.ListPrice || 0) < (existing.ListPrice || 0)) {
                    isNewOrPriceDrop = true;
                    stats.priceDrops++;
                }

                const updates: any = {
                    ListPrice: propertyToSave.ListPrice,
                    StandardStatus: propertyToSave.StandardStatus,
                    Media: propertyToSave.Media,
                    PublicRemarks: propertyToSave.PublicRemarks,
                };
                if (propertyToSave.ListAgentMlsId !== undefined) updates.ListAgentMlsId = propertyToSave.ListAgentMlsId;
                if (propertyToSave.ListOfficeMlsId !== undefined) updates.ListOfficeMlsId = propertyToSave.ListOfficeMlsId;

                existing.update(updates);
                propertyToSave = existing;
                stats.updated++;
            } else {
                isNewOrPriceDrop = true;
                stats.added++;
            }

            await this.firestoreRepo.save(propertyToSave);

            const shouldEmbed = !(options.skipEmbeddingIfUnchanged && existing && !remarksChanged);
            if (shouldEmbed) {
                try {
                    await this.vectorService.execute(propertyToSave);
                    stats.embedded++;
                } catch (vecErr: any) {
                    console.warn(`[SyncBridgeProperties] Vectorization skipped for ${externalId}:`, vecErr.message);
                    stats.embeddingsSkipped++;
                }
            } else {
                stats.embeddingsSkipped++;
            }

            if (isNewOrPriceDrop) newlyDiscovered.push(propertyToSave);

            stats.processed++;
            stats.lastListingKey = externalId;
        }

        if (newlyDiscovered.length > 0) {
            try {
                await this.dispatchService.execute(newlyDiscovered);
            } catch (dispatchErr: any) {
                console.warn(`[SyncBridgeProperties] Dispatch alerts failed:`, dispatchErr.message);
            }
        }

        stats.durationMs = Date.now() - started;
        return stats;
    }

    /**
     * Synchronizes active properties via advanced MLS OData filters.
     * Legacy single-batch method kept for backward compatibility with the cron.
     */
    async syncProperties(filters: { zone?: string; minBeds?: number; maxPrice?: number; propertyType?: string; agentId?: string; officeId?: string }, limit: number = 50, skip: number = 0): Promise<{ synced: number }> {
        console.log(`[SyncBridgeProperties] Starting sync with filters:`, filters);

        const bridgeItems = await this.bridgeRepo.getActiveProperties(filters as AdvancedPropertyFilters, limit, skip);
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
