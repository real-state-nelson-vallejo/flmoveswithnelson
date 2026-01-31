import { Lead } from "./Lead";

export interface LeadRepository {
    save(lead: Lead): Promise<void>;
    findByEmail(email: string): Promise<Lead | null>;
    findAll(): Promise<Lead[]>;
}
