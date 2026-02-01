import { Lead, LeadProps, LeadStatus } from "../domain/Lead";
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
    async findById(id: string): Promise<Lead | null> {
        return this.leads.get(id) || null;
    }

    async update(id: string, data: Partial<LeadProps>): Promise<void> {
        const lead = this.leads.get(id);
        if (lead) {
            const currentProps = lead.toPersistence(); // Assumes persistence model matches props roughly or use toDTO if simpler, but persistence is safer
            // We need to merge. LeadPersistence has interactions/etc.
            const updatedProps = { ...currentProps, ...data };
            // Re-instantiate
            const updatedLead = Lead.fromPersistence(updatedProps);
            this.leads.set(id, updatedLead);
        }
    }

    async updateStatus(id: string, status: LeadStatus): Promise<void> {
        const lead = this.leads.get(id);
        if (lead) {
            lead.updateStatus(status);
            this.leads.set(id, lead);
        }
    }
}
