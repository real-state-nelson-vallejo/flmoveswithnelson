import { RentCastEnrichment } from "./RentCastEnrichment";

export interface MarketRepository {
    // Cache retrieval by address (normalized) to allow reuse across property IDs
    getCachedData(address: string, zip: string): Promise<RentCastEnrichment | null>;

    // Save with address context
    saveEnrichmentData(data: RentCastEnrichment, address: string, zip: string): Promise<void>;
}
