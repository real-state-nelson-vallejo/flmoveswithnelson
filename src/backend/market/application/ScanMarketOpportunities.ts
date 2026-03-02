import { MarketDataService } from "../domain/MarketDataService";
import { MarketOpportunityRepository } from "../domain/MarketOpportunityRepository";
import { MarketOpportunity } from "../domain/MarketOpportunity";

export class ScanMarketOpportunities {
    constructor(
        private marketDataService: MarketDataService,
        private opportunityRepository: MarketOpportunityRepository
    ) { }

    async execute(zipCodes: string[]): Promise<MarketOpportunity[]> {
        const opportunities: MarketOpportunity[] = [];

        for (const zip of zipCodes) {
            console.log(`Scanning zip code: ${zip}...`);
            const listings = await this.marketDataService.getActiveListings(zip);

            for (const listing of listings) {
                // For each listing, we need enriched data (AVM/Rent) to analyze
                // In production, we should be careful about rate limits here.
                // Optimally, we batch this or check AVM only if price looks "interesting" relative to zip average.
                // For now, we fetch enrichment for all to demonstrate the logic.

                try {
                    const enrichment = await this.marketDataService.getEnrichedData(
                        listing.address,
                        listing.city,
                        listing.state,
                        listing.zipCode,
                        { beds: listing.bedrooms, baths: listing.bathrooms, propertyType: listing.propertyType }
                    );

                    const estValue = enrichment.valuation.price;
                    const estRent = enrichment.valuation.rent;
                    const listPrice = listing.price;

                    // 1. Flip Strategy: 10% Equity (Relaxed from 15%)
                    if (estValue > 0 && listPrice < estValue * 0.90) {
                        const discount = estValue - listPrice;
                        const percent = discount / estValue;

                        const opp = new MarketOpportunity({
                            id: `flip-${listing.id}`,
                            listing: listing,
                            type: 'flip',
                            estimatedValue: estValue,
                            estimatedRent: estRent,
                            discountAmount: discount,
                            discountPercent: percent,
                            detectedAt: Date.now()
                        });

                        await this.opportunityRepository.save(opp);
                        opportunities.push(opp);
                        console.log(`Found FLIP opportunity: ${listing.address} (Discount: ${Math.round(percent * 100)}%)`);
                    }

                    // 2. Cashflow Strategy: Cap Rate > 6% (Relaxed from 8%)
                    // Gross Rent Multiplier logic or simple Cap Rate?
                    // Simple Cap Rate = (Net Operating Income / Price)
                    // Rule of thumb: Expense Ratio ~40% of Gross Rent (Prop tax, insurance, maintenance, vacancy)
                    // NOI = (Annual Rent * 0.6)

                    if (estRent > 0 && listPrice > 0) {
                        const annualGrossRent = estRent * 12;
                        const noi = annualGrossRent * 0.6;
                        const capRate = (noi / listPrice) * 100;

                        if (capRate > 6) {
                            const opp = new MarketOpportunity({
                                id: `rent-${listing.id}`,
                                listing: listing,
                                type: 'cashflow',
                                estimatedValue: estValue,
                                estimatedRent: estRent,
                                capRate: parseFloat(capRate.toFixed(2)),
                                cashFlow: parseFloat((estRent * 0.6 - (listPrice * 0.005)).toFixed(2)), // Very rough cashflow mock (Mortgage~0.5%?)
                                detectedAt: Date.now()
                            });

                            await this.opportunityRepository.save(opp);
                            opportunities.push(opp);
                            console.log(`Found CASHFLOW opportunity: ${listing.address} (Cap Rate: ${capRate.toFixed(1)}%)`);
                        }
                    }

                } catch (error) {
                    console.error(`Error analyzing listing ${listing.address}:`, error);
                }
            }
        }

        return opportunities;
    }
}
