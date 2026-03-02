import { MarketDataService } from "../domain/MarketDataService";
import { MarketRepository } from "../domain/MarketRepository";
import { RentCastEnrichment } from "../domain/RentCastEnrichment";

export class EnrichPropertyData {
    constructor(
        private marketDataService: MarketDataService,
        private marketRepository: MarketRepository
    ) { }

    async execute(
        propertyId: string,
        address: string,
        city: string,
        state: string,
        zip: string,
        propertySpecs: { beds: number; baths: number; yearBuilt?: number; propertyType?: string }
    ): Promise<RentCastEnrichment> {

        // 1. Check Cache
        const cacheddata = await this.marketRepository.getCachedData(address, zip);
        if (cacheddata) {
            console.log("Returning cached RentCast data");
            return cacheddata;
        }

        // 2. Fetch from API (RentCast)
        console.log("Cache miss. Fetching from RentCast API...");
        const freshData = await this.marketDataService.getEnrichedData(
            address,
            city,
            state,
            zip,
            propertySpecs
        );

        // 3. Enrich with Property ID and Save to Cache
        const enrichment: RentCastEnrichment = {
            ...freshData,
            propertyId: propertyId,
            lastRetrieved: Date.now()
        };

        await this.marketRepository.saveEnrichmentData(enrichment, address, zip);

        return enrichment;
    }
}
