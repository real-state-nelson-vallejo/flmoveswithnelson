import { Lead } from "../domain/Lead";
import { LeadRepository } from "../domain/LeadRepository";


export class CaptureLead {
    constructor(private readonly repository: LeadRepository) { }

    async execute(data: { name: string; email: string; phone?: string | undefined; propertyId?: string | undefined }): Promise<Lead> {
        // Check if lead exists
        let lead = await this.repository.findByEmail(data.email);

        if (!lead) {
            lead = Lead.create({
                name: data.name,
                email: data.email,
                phone: data.phone,
                source: 'web'
            });
        }

        // Record interaction using domain method
        lead.addInteraction('contact_request', 'Initial contact form submission', data.propertyId);

        await this.repository.save(lead);
        return lead;
    }
}
