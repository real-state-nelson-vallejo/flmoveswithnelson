import { Lead } from "./Lead";

export interface LeadRepository {
    save(lead: Lead): Promise<void>;
    findById(id: string): Promise<Lead | null>;
    findAll(): Promise<Lead[]>;
    updateStatus(id: string, status: Lead['status']): Promise<void>;
}
