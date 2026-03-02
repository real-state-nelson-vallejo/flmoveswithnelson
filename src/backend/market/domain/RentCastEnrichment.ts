import { z } from 'zod';

// Value Object: Valuation Estimate (AVM)
export const ValuationEstimateSchema = z.object({
    price: z.number(),
    priceRangeLow: z.number(),
    priceRangeHigh: z.number(),
    rent: z.number(),
    rentRangeLow: z.number(),
    rentRangeHigh: z.number(),
    lastUpdated: z.date()
});

// Value Object: Market Statistics for the Zip Code
export const MarketStatsSchema = z.object({
    averagedaysOnMarket: z.number(),
    averageRent: z.number(),
    averagePrice: z.number(), // Sold Price
    priceTrendLine: z.array(z.object({
        date: z.string(),
        price: z.number()
    })).optional()
});

// Value Object: Comparable Listing
export const ComparableListingSchema = z.object({
    id: z.string(),
    address: z.string(),
    price: z.number(),
    type: z.enum(['sale', 'rent']),
    distance: z.number(), // Distance from subject property
    listedDate: z.string(),
    images: z.array(z.string()).optional()
});

// Entity: RentCast Enrichment Data (Attached to Property)
export const RentCastEnrichmentSchema = z.object({
    propertyId: z.string(),
    lastRetrieved: z.number(), // Timestamp
    valuation: ValuationEstimateSchema,
    marketStats: MarketStatsSchema,
    rentalComps: z.array(ComparableListingSchema),
    saleComps: z.array(ComparableListingSchema)
});

export type ValuationEstimate = z.infer<typeof ValuationEstimateSchema>;
export type MarketStats = z.infer<typeof MarketStatsSchema>;
export type ComparableListing = z.infer<typeof ComparableListingSchema>;
export type RentCastEnrichment = z.infer<typeof RentCastEnrichmentSchema>;
