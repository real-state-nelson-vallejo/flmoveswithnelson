import { PropertyListing } from "./PropertyListing";

export type OpportunityType = 'flip' | 'cashflow';

export class MarketOpportunity {
    id: string;
    listing: PropertyListing;
    type: OpportunityType;

    // Analysis Metrics
    estimatedValue: number;
    estimatedRent: number;

    // Flip Metrics
    discountAmount?: number;
    discountPercent?: number; // e.g. 0.15 for 15% discount

    // Cashflow Metrics
    capRate?: number;
    cashFlow?: number;

    detectedAt: number;

    constructor(data: {
        id: string;
        listing: PropertyListing;
        type: OpportunityType;
        estimatedValue: number;
        estimatedRent: number;
        discountAmount?: number;
        discountPercent?: number;
        capRate?: number;
        cashFlow?: number;
        detectedAt?: number;
    }) {
        this.id = data.id;
        this.listing = data.listing;
        this.type = data.type;
        this.estimatedValue = data.estimatedValue;
        this.estimatedRent = data.estimatedRent;
        if (data.discountAmount !== undefined) this.discountAmount = data.discountAmount;
        if (data.discountPercent !== undefined) this.discountPercent = data.discountPercent;
        if (data.capRate !== undefined) this.capRate = data.capRate;
        if (data.cashFlow !== undefined) this.cashFlow = data.cashFlow;
        this.detectedAt = data.detectedAt || Date.now();
    }
}
