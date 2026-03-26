import { FirestoreMarketRepository } from "./infrastructure/FirestoreMarketRepository";
import { FirestoreOpportunityRepository } from "./infrastructure/FirestoreOpportunityRepository";

const marketRepository = new FirestoreMarketRepository();
const opportunityRepository = new FirestoreOpportunityRepository();

// Mocked service to prevent compilation errors for the deprecated Scalper cron job
const marketDataService = {
    getActiveListings: async () => [],
    getEnrichedData: async () => { throw new Error("RentCast Deprecated"); }
} as any;

export const marketDependencies = {
    marketRepository,
    marketDataService,
    opportunityRepository
};
