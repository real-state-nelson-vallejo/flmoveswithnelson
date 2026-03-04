import { Interaction, LeadStatus } from "../../domain/Lead";

export interface LeadPersistence {
    id: string;
    name: string;
    email: string;
    phone?: string | undefined;
    status: LeadStatus;
    source: string;
    intent?: string | undefined;
    propertyId?: string | undefined;
    notes?: string | undefined;
    interactions: Interaction[];
    score: number;
    createdAt: number;
    updatedAt: number;
}
