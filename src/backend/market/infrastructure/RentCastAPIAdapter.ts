import { MarketDataService } from "../domain/MarketDataService";
import { RentCastEnrichment } from "../domain/RentCastEnrichment";
import { PropertyListing } from "../domain/PropertyListing";

export class RentCastAPIAdapter implements MarketDataService {
    private apiKey: string;
    private baseUrl = 'https://api.rentcast.io/v1';

    constructor() {
        this.apiKey = process.env.RENTCAST_API_KEY || '';
        if (!this.apiKey) {
            console.warn("RENTCAST_API_KEY is not set. Using mock data.");
        }
    }

    private async fetchFromApi(endpoint: string, params: Record<string, string | number | undefined>): Promise<any> {
        if (!this.apiKey) {
            throw new Error("RentCast API Key is missing");
        }

        const url = new URL(`${this.baseUrl}${endpoint}`);
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });

        console.log(`[RentCast] → ${url.toString()}`);

        const response = await fetch(url.toString(), {
            headers: {
                'X-Api-Key': this.apiKey,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`RentCast API Error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async getEnrichedData(
        address: string,
        city: string,
        state: string,
        zip: string,
        propertySpecs: { beds: number; baths: number; yearBuilt?: number; propertyType?: string }
    ): Promise<RentCastEnrichment> {

        if (!this.apiKey) {
            // Return mock if no key (dev mode)
            console.log(`[RentCast] API Key missing. Returning MOCK data for ${address}`);
            return this.getMockData();
        }

        // RentCast expects a single 'address' param: "Street, City, State, Zip"
        const fullAddress = `${address}, ${city}, ${state}, ${zip}`;
        console.log(`[RentCast] Fetching REAL data for: ${fullAddress}`);

        try {
            // 1. Get AVM (Value & Rent) — RentCast uses single 'address' string
            const avmParams = {
                address: fullAddress,
                propertyType: propertySpecs.propertyType || 'Single Family',
                bedrooms: propertySpecs.beds,
                bathrooms: propertySpecs.baths,
            };

            const [valueData, rentData] = await Promise.all([
                this.fetchFromApi('/avm/value', avmParams).catch(e => { console.error("[RentCast] AVM Value failed:", e.message); return null; }),
                this.fetchFromApi('/avm/rent/long-term', avmParams).catch(e => { console.error("[RentCast] AVM Rent failed:", e.message); return null; })
            ]);

            // 2. Get Market Stats — endpoint is /markets, param is zipCode
            const marketData = await this.fetchFromApi('/markets', { zipCode: zip }).catch(e => { console.error("[RentCast] Market Stats failed:", e.message); return null; });

            // 3. Get Comparable Listings (by zipCode for broader results)
            const listingParams = { zipCode: zip, bedrooms: propertySpecs.beds, limit: 5, status: 'Active' };
            const [rentalComps, saleComps] = await Promise.all([
                this.fetchFromApi('/listings/rental/long-term', listingParams).catch(e => { console.error("[RentCast] Rental Comps failed:", e.message); return []; }),
                this.fetchFromApi('/listings/sale', listingParams).catch(e => { console.error("[RentCast] Sale Comps failed:", e.message); return []; })
            ]);

            // Construct Aggregate Data

            return {
                propertyId: 'temp-id',
                lastRetrieved: Date.now(),
                valuation: {
                    price: valueData?.price || 0,
                    priceRangeLow: valueData?.priceRangeLow || 0,
                    priceRangeHigh: valueData?.priceRangeHigh || 0,
                    rent: rentData?.rent || 0,
                    rentRangeLow: rentData?.rentRangeLow || 0,
                    rentRangeHigh: rentData?.rentRangeHigh || 0,
                    lastUpdated: new Date()
                },
                marketStats: {
                    averagedaysOnMarket: marketData?.daysOnMarket || 0,
                    averageRent: marketData?.averageRent || 0,
                    averagePrice: marketData?.averagePrice || 0,
                },
                rentalComps: (rentalComps || []).map((c: any) => ({
                    id: c.id,
                    address: c.formattedAddress || c.addressLine1,
                    price: c.price,
                    type: 'rent',
                    distance: c.distance || 0,
                    listedDate: c.createdDate || new Date().toISOString()
                })),
                saleComps: (saleComps || []).map((c: any) => ({
                    id: c.id,
                    address: c.formattedAddress || c.addressLine1,
                    price: c.price,
                    type: 'sale',
                    distance: c.distance || 0,
                    listedDate: c.createdDate || new Date().toISOString()
                }))
            } as RentCastEnrichment;

        } catch (error) {
            console.error("Failed to fetch enriched data structure", error);
            return this.getMockData(); // Fallback on error
        }
    }

    async getActiveListings(zipCode: string): Promise<PropertyListing[]> {
        if (!this.apiKey) {
            console.log(`Fetching active listings for zip ${zipCode} (Mocked)`);
            return this.getMockListings(zipCode);
        }

        try {
            console.log(`Fetching REAL active listings for zip ${zipCode}`);
            const listings = await this.fetchFromApi('/listings/sale', { zipCode, status: 'Active', limit: 5 });

            if (!Array.isArray(listings)) {
                console.warn("[RentCast] getActiveListings returned non-array:", listings);
                return [];
            }

            return listings.map((l: any) => ({
                id: l.id,
                address: l.formattedAddress,
                city: l.city,
                state: l.state,
                zipCode: l.zipCode,
                price: l.price,
                bedrooms: l.bedrooms,
                bathrooms: l.bathrooms,
                livingArea: l.squareFootage,
                propertyType: l.propertyType,
                listedDate: l.createdDate,
                yearBuilt: l.yearBuilt,
                images: l.images || [], // RentCast returns array of image URLs
                features: l.features || []
            }));

        } catch (error) {
            console.error("Failed to fetch active listings", error);
            return [];
        }
    }

    private getMockData(): RentCastEnrichment {
        return {
            propertyId: 'temp-id',
            lastRetrieved: Date.now(),
            valuation: {
                price: 450000,
                priceRangeLow: 420000,
                priceRangeHigh: 480000,
                rent: 3200,
                rentRangeLow: 3000,
                rentRangeHigh: 3500,
                lastUpdated: new Date()
            },
            marketStats: {
                averagedaysOnMarket: 45,
                averageRent: 3100,
                averagePrice: 460000
            },
            rentalComps: [
                {
                    id: 'comp-1',
                    address: '123 Nearby St',
                    price: 3300,
                    type: 'rent',
                    distance: 0.2,
                    listedDate: new Date().toISOString()
                }
            ],
            saleComps: [
                {
                    id: 'sale-1',
                    address: '456 Sold Ave',
                    price: 445000,
                    type: 'sale',
                    distance: 0.5,
                    listedDate: new Date().toISOString()
                }
            ]
        };
    }

    private getMockListings(zipCode: string): PropertyListing[] {
        return [
            {
                id: 'listing-1',
                address: '101 Opportunity Ln',
                city: 'Miami',
                state: 'FL',
                zipCode: zipCode,
                price: 350000,
                bedrooms: 3,
                bathrooms: 2,
                livingArea: 1500,
                propertyType: 'Single Family',
                listedDate: new Date().toISOString()
            },
            {
                id: 'listing-2',
                address: '202 CashFlow Blvd',
                city: 'Miami',
                state: 'FL',
                zipCode: zipCode,
                price: 280000,
                bedrooms: 2,
                bathrooms: 2,
                livingArea: 1100,
                propertyType: 'Condo',
                listedDate: new Date().toISOString()
            }
        ];
    }
}
