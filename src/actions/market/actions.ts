"use server";

import { marketDependencies } from "@/backend/market/dependencies";

export async function getMarketOpportunitiesAction() {
    try {
        const opportunities = await marketDependencies.opportunityRepository.findAll();
        // Serialize class instances to plain objects for client
        return {
            success: true,
            opportunities: opportunities.map(opp => ({
                id: opp.id,
                listing: opp.listing,
                type: opp.type,
                estimatedValue: opp.estimatedValue,
                estimatedRent: opp.estimatedRent,
                discountAmount: opp.discountAmount,
                discountPercent: opp.discountPercent,
                capRate: opp.capRate,
                cashFlow: opp.cashFlow,
                detectedAt: opp.detectedAt
            }))
        };
    } catch (error) {
        console.error("Error fetching opportunities:", error);
        return { success: false, error: "Failed to fetch opportunities" };
    }
}

export async function runMarketScanAction(zips: string[]) {
    // This action can be called manually from the dashboard
    try {
        // We'll just call the API route internally? No, better use the UseCase directly
        // But the UseCase is not exported nicely or instantiation is needed.
        // We can re-instantiate or expose a singleton scanner in dependencies.
        // For now, let's just use the API route URL or instantiate UseCase.

        // Let's import the use case class and run it.
        const { ScanMarketOpportunities } = await import("@/backend/market/application/ScanMarketOpportunities");
        const scanner = new ScanMarketOpportunities(
            marketDependencies.marketDataService,
            marketDependencies.opportunityRepository
        );

        const results = await scanner.execute(zips);

        return { success: true, count: results.length };
    } catch (error) {
        console.error("Error running scan:", error);
        return { success: false, error: "Failed to run scan" };
    }
}
