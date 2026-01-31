import { Lead } from "../domain/Lead";
import { LeadRepository } from "../domain/LeadRepository";


export class CaptureLead {
    constructor(private readonly repository: LeadRepository) { }

    async execute(data: { name: string; email: string; phone?: string; propertyId?: string }): Promise<Lead> {
        // Check if lead exists
        let lead = await this.repository.findByEmail(data.email);

        if (!lead) {
            lead = {
                id: crypto.randomUUID(),
                name: data.name,
                email: data.email,
                phone: data.phone,
                interactions: [],
                status: 'new',
                score: 0,
                createdAt: new Date(),
            };
        }

        // Record interaction
        lead.interactions.push({
            id: crypto.randomUUID(),
            type: 'contact_request',
            propertyId: data.propertyId,
            timestamp: new Date(),
            details: 'Initial contact form submission'
        });

        // Basic scoring
        lead.score += 10;

        await this.repository.save(lead);
        return lead;
    }
}
