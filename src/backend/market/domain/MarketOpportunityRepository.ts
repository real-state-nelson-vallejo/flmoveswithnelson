import { MarketOpportunity } from "./MarketOpportunity";

export interface MarketOpportunityRepository {
    save(opportunity: MarketOpportunity): Promise<void>;
    findAll(): Promise<MarketOpportunity[]>;
    // findByZip(zip: string): Promise<MarketOpportunity[]>;
}
