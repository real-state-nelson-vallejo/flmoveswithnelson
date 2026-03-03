
import { LeadRepository } from "@/backend/lead/domain/LeadRepository";
// Removed unused import

export class QualifyLeadService {
    constructor(private readonly repository: LeadRepository) { }

    async execute(input: {
        leadId: string;
        notes?: string | undefined;
        budget?: string | undefined;
        timeline?: string | undefined;
        preferredLocation?: string | undefined;
    }): Promise<void> {
        const lead = await this.repository.findById(input.leadId);

        if (!lead) {
            console.warn(`[QualifyLead] Lead ${input.leadId} not found, cannot update qualification info.`);
            // Ideally throw, but for AI resilience we might just log if ID is hallucinated.
            // But let's throw to let the agent know.
            throw new Error(`Lead ${input.leadId} not found`);
        }

        // We append new notes or structured data to the 'notes' field for now, 
        // until we have dedicated fields in the Lead model for budget/timeline.
        // Or we use 'details' in a new interaction.

        let updateDetails = "";
        if (input.budget) updateDetails += `Budget: ${input.budget}\n`;
        if (input.timeline) updateDetails += `Timeline: ${input.timeline}\n`;
        if (input.preferredLocation) updateDetails += `Location: ${input.preferredLocation}\n`;
        if (input.notes) updateDetails += `Notes: ${input.notes}\n`;

        if (updateDetails) {
            // Option A: Append to notes
            // const currentNotes = lead.props.notes || "";
            // await this.repository.update(lead.id, { notes: currentNotes + "\n" + updateDetails });

            // Option B: Add as an interaction (cleaner for history)
            lead.addInteraction('contact_request', `Qualification Update:\n${updateDetails}`);
            await this.repository.save(lead);
        }
    }
}
