import { LeadRepository } from "@/backend/lead/domain/LeadRepository";
import { Lead } from "@/backend/lead/domain/Lead";

export interface VoiceLeadParams {
    callerPhone: string;
    fromCity?: string;
    fromState?: string;
    fromCountry?: string;
    fromZip?: string;
    callerName?: string;
}

export class GetOrCreateVoiceLeadService {
    constructor(private readonly repository: LeadRepository) { }

    async execute(params: VoiceLeadParams): Promise<Lead> {
        // Find existing Lead by phone
        const existingLeads = await this.repository.findByPhone(params.callerPhone);

        if (existingLeads && existingLeads.length > 0) {
            // Pick the first match
            const lead = existingLeads[0]!;
            lead.addInteraction('contact_request', 'Inbound Voice Call Received.');
            await this.repository.save(lead);
            return lead;
        }

        // Generate a placeholder name based on metadata if callerName is missing
        let defaultName = params.callerName || 'Unknown Caller';
        if (defaultName === 'Unknown Caller' && params.fromCity) {
            defaultName = `Caller from ${params.fromCity}`;
        }

        // Build notes from geography
        const metaNotes = [
            params.fromCity ? `City: ${params.fromCity}` : null,
            params.fromState ? `State: ${params.fromState}` : null,
            params.fromCountry ? `Country: ${params.fromCountry}` : null,
            params.fromZip ? `Zip: ${params.fromZip}` : null,
        ].filter(Boolean).join(', ');

        const notes = `Source: Twilio Voice Call.\n${metaNotes}`;

        // Create new
        const newLead = Lead.create({
            name: defaultName,
            email: `voice-${params.callerPhone.replace(/\+/g, '')}@flmoveswithnelson.com`, // Dummy email since required
            phone: params.callerPhone,
            source: 'voice'
        });

        // Add metadata to notes
        newLead.toPersistence().notes = notes;

        newLead.addInteraction('contact_request', 'Initial Inbound Voice Call.');

        await this.repository.save(newLead);
        return newLead;
    }
}
