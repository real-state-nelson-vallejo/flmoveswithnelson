import { Lead, LeadProps, LeadStatus } from "./Lead";

export interface LeadRepository {
    save(lead: Lead): Promise<void>;
    update(id: string, data: Partial<LeadProps>): Promise<void>;
    updateStatus(id: string, status: LeadStatus): Promise<void>;
    findById(id: string): Promise<Lead | null>;
    findByEmail(email: string): Promise<Lead | null>;
    findAll(): Promise<Lead[]>;
}
