'use server';

import { startConversationAction } from "./actions";
import { revalidatePath } from "next/cache";

export async function seedCrmDataAction() {
    const mockLeads = [
        { name: "Sofia Martinez", interest: "Buying", message: "Hola, estoy interesada en el apartamento del centro." },
        { name: "Carlos Ruiz", interest: "Renting", message: "Busco alquiler por zona norte, presupuesto 800€." },
        { name: "Investment Corp", interest: "Investing", message: "Quiero diversificar mi portafolio con propiedades de lujo." }
    ];

    const randomLead = mockLeads[Math.floor(Math.random() * mockLeads.length)];
    const agentId = "agent-123"; // MOCK_USER_ID
    const userId = crypto.randomUUID(); // Simulated external user

    await startConversationAction(
        [userId, agentId], // Participants
        randomLead.message,
        {
            subject: `${randomLead.interest} Inquiry`,
            leadName: randomLead.name,
            leadId: crypto.randomUUID()
        }
    );

    revalidatePath('/dashboard/inbox');
    return { success: true, lead: randomLead.name };
}
