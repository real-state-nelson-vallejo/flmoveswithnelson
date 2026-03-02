import { FirestoreMarketRepository } from "./infrastructure/FirestoreMarketRepository";
import { RentCastAPIAdapter } from "./infrastructure/RentCastAPIAdapter";
import { FirestoreOpportunityRepository } from "./infrastructure/FirestoreOpportunityRepository";

const marketRepository = new FirestoreMarketRepository();
const marketDataService = new RentCastAPIAdapter();
const opportunityRepository = new FirestoreOpportunityRepository();

export const marketDependencies = {
    marketRepository,
    marketDataService,
    opportunityRepository
};
