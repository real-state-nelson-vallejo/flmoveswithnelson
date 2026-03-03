
import { tool, z } from 'genkit';
import { FirestoreLeadRepository } from '@/backend/lead/infrastructure/FirestoreLeadRepository';
import { QualifyLeadService } from '@/backend/crm/application/QualifyLeadService';

const leadRepository = new FirestoreLeadRepository();
const qualifyLead = new QualifyLeadService(leadRepository);

export const getLeadTools = () => {
    const TOOLS_NAME = 'leadToolsInstances';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((globalThis as any)[TOOLS_NAME]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (globalThis as any)[TOOLS_NAME];
    }

    const tools = [
        tool(
            {
                name: 'update_lead_profile',
                description: 'Update the lead/user profile with qualification details (budget, timeline, etc.) discovered during the chat.',
                inputSchema: z.object({
                    leadId: z.string().describe('ID of the lead'),
                    budget: z.string().optional().describe('Budget range (e.g. $400k - $500k)'),
                    timeline: z.string().optional().describe('Timeframe to buy (e.g. ASAP, 3 months)'),
                    preferredLocation: z.string().optional().describe('Preferred cities or areas'),
                    notes: z.string().optional().describe('Any other relevant details or specific requirements')
                }),
                outputSchema: z.object({
                    success: z.boolean(),
                    message: z.string()
                })
            },
            async (input) => {
                await qualifyLead.execute(input);
                return {
                    success: true,
                    message: "Lead profile updated successfully."
                };
            }
        )
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[TOOLS_NAME] = tools;
    return tools;
};
