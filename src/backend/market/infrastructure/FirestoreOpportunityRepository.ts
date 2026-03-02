import { MarketOpportunity } from "../domain/MarketOpportunity";
import { MarketOpportunityRepository } from "../domain/MarketOpportunityRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreOpportunityRepository implements MarketOpportunityRepository {
    async save(opportunity: MarketOpportunity): Promise<void> {
        // Convert to plain object
        const data = {
            id: opportunity.id,
            listing: opportunity.listing,
            type: opportunity.type,
            estimatedValue: opportunity.estimatedValue,
            estimatedRent: opportunity.estimatedRent,
            discountAmount: opportunity.discountAmount,
            discountPercent: opportunity.discountPercent,
            capRate: opportunity.capRate,
            cashFlow: opportunity.cashFlow,
            detectedAt: opportunity.detectedAt
        };

        // Remove undefined fields
        Object.keys(data).forEach(key => data[key as keyof typeof data] === undefined && delete data[key as keyof typeof data]);

        await adminDb.collection('market_opportunities').doc(opportunity.id).set(data);
    }

    async findAll(): Promise<MarketOpportunity[]> {
        const snapshot = await adminDb.collection('market_opportunities').orderBy('detectedAt', 'desc').get();
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return new MarketOpportunity({
                id: data.id,
                listing: data.listing,
                type: data.type,
                estimatedValue: data.estimatedValue,
                estimatedRent: data.estimatedRent,
                discountAmount: data.discountAmount,
                discountPercent: data.discountPercent,
                capRate: data.capRate,
                cashFlow: data.cashFlow,
                detectedAt: data.detectedAt
            });
        });
    }
}
