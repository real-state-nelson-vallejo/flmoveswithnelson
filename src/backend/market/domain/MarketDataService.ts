import { RentCastEnrichment } from "./RentCastEnrichment";
import { PropertyListing } from "./PropertyListing";

export interface MarketDataService {
    /**
     * Retrieves enriched value, rent, and market data for a property.
     * @param address Full address string
     * @param zip Zip code for market stats
     * @param propertySpecs Specs to filter comps (beds, baths, etc.)
     */
    getEnrichedData(
        address: string,
        city: string,
        state: string,
        zip: string,
        propertySpecs: { beds: number; baths: number; yearBuilt?: number; propertyType?: string }
    ): Promise<RentCastEnrichment>;

    getActiveListings(zipCode: string): Promise<PropertyListing[]>;
}
