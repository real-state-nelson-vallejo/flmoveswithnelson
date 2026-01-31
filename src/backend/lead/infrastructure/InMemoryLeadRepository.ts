import { Lead } from "../domain/Lead";
import { LeadRepository } from "../domain/LeadRepository";

export class InMemoryLeadRepository implements LeadRepository {
    private leads: Map<string, Lead> = new Map();

    async save(lead: Lead): Promise<void> {
        this.leads.set(lead.id, lead);
    }

    async findByEmail(email: string): Promise<Lead | null> {
        for (const lead of this.leads.values()) {
            if (lead.email === email) return lead;
        }
        return null;
    }

    async findAll(): Promise<Lead[]> {
        return Array.from(this.leads.values());
    }
}
