'use server';

import { conversationDependencies } from "@/backend/conversation/dependencies";
import { revalidatePath } from "next/cache";
import { LeadStatus } from "@/types/lead";
import type { LeadPersistence } from "@/backend/lead/infrastructure/dto/LeadPersistence";

export async function getConversationsAction() {
    try {
        // For admin dashboard, fetch ALL conversations
        const conversations = await conversationDependencies.conversationRepository.findAll();
        return { success: true, data: conversations.map(c => c.toDTO()) };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getMessagesAction(conversationId: string) {
    try {
        const messages = await conversationDependencies.conversationRepository.findMessagesByConversationId(conversationId);
        return { success: true, data: messages.map(m => m.toDTO()) };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error: "Failed to fetch messages" };
    }
}

export async function getLeadByIdAction(leadId: string) {
    try {
        const { leadDependencies } = await import("@/backend/lead/dependencies");
        const lead = await leadDependencies.leadRepository.findById(leadId);
        if (!lead) {
            return { success: false, error: "Lead not found" };
        }
        return { success: true, data: lead.toDTO() };
    } catch (error) {
        console.error("Error fetching lead:", error);
        return { success: false, error: "Failed to fetch lead" };
    }
}


// We change the signature to accept scalars instead of Message object to avoid leaking Domain types to client?
// Or we accept a DTO. The client currently sends a full object.
// We'll adapt it.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendMessageAction(message: any) {
    try {
        // Use the proper service
        await conversationDependencies.sendMessage.execute(
            message.conversationId,
            message.senderId,
            message.senderRole,
            message.content,
            message.type
        );
        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

// --- AI Integration ---

// --- AI Integration ---

import { CRMConfig } from "@/backend/crm/domain/CRMConfig";
import { FirestoreCRMRepository } from "@/backend/crm/infrastructure/FirestoreCRMRepository";
import { GenkitAgentService } from "@/backend/ai/application/GenkitAgentService";

export async function generateAIReplyAction(conversationId: string) {
    try {
        // 1. Fetch conversation history via Service
        const messages = await conversationDependencies.conversationRepository.findMessagesByConversationId(conversationId, 20);

        if (messages.length === 0) {
            return { success: false, error: "No messages to reply to" };
        }

        // 2. Fetch Conversation to get Lead ID (Context)
        const conversation = await conversationDependencies.conversationRepository.findById(conversationId);
        let leadContext = {};

        if (conversation) {
            // Find participant that is NOT system-ai or agent (assuming user/lead)
            const leadId = conversation.participants.find(p => p !== 'system-ai' && p !== 'agent');
            if (leadId) {
                try {
                    const { leadDependencies } = await import("@/backend/lead/dependencies");
                    const lead = await leadDependencies.leadRepository.findById(leadId);
                    if (lead) {
                        leadContext = {
                            leadName: lead.name,
                            leadId: lead.id,
                            leadEmail: lead.email,
                            leadPhone: lead.phone,
                            leadNotes: `Source: ${lead.source}, Status: ${lead.status}`
                        };
                    }
                } catch (e) {
                    console.warn("Failed to fetch lead context:", e);
                }
            }
        }


        // 3. Format history for Genkit
        // GenkitAgentService expects strictly { role: string, content: string | Part[] }
        // We'll normalize to the format expected by GenkitAgentService
        const validHistory = messages.slice(0, -1).map(m => ({
            role: (m.senderRole === 'user' ? 'user' : 'model'),
            content: m.content
        }));

        const userInput = messages[messages.length - 1]!.content;

        console.log(`[generateAIReplyAction] Generating reply for convo ${conversationId}...`);

        // 4. Generate Response using GenkitAgentService (Supports Tools)
        const service = new GenkitAgentService();
        const aiResult = await service.generateResponse({
            message: userInput,
            history: validHistory,
            context: leadContext
        });

        const aiText = aiResult.text;
        const toolOutput = aiResult.toolOutput;
        const debugLogs = aiResult.debugLogs;

        // 5. Save AI Response using Service
        await conversationDependencies.sendMessage.execute(
            conversationId,
            'system-ai',
            'system',
            aiText,
            'text',
            {
                // We store usage if available (GenkitAgentService currently doesn't return usage in the main object, but we can add it later)
                // We store toolOutput if present
                ...(toolOutput ? { toolOutput } : {}),
                debugLogs // Optional: save debug logs for admin inspection
            }
        );

        revalidatePath('/dashboard/inbox');

        return { success: true };

    } catch (error) {
        console.error("AI Gen Error:", error);
        return { success: false };
    }
}

export async function startConversationAction(participants: string[], initialMessage: string, metadata?: Record<string, unknown>) {
    try {
        const conversation = await conversationDependencies.startConversation.execute(
            participants,
            initialMessage,
            'web_chat',
            metadata
        );

        revalidatePath('/dashboard/inbox');
        return { success: true, conversationId: conversation.id };
    } catch (error) {
        console.error("Error starting conversation:", error);
        return { success: false, error: "Failed to start conversation" };
    }
}
// --- Leads Actions (CRM) ---

import { Lead, LeadProps } from "@/backend/lead/domain/Lead";
import { leadDependencies } from "@/backend/lead/dependencies";

// ...

export async function getLeadsAction() {
    try {
        const leads = await leadDependencies.leadRepository.findAll();
        return { success: true, leads: leads.map(l => l.toDTO()) };
    } catch (error) {
        console.error("Error fetching leads:", error);
        return { success: false, error: "Failed" };
    }
}

export async function updateLeadStatusAction(leadId: string, status: LeadStatus) {
    try {
        await leadDependencies.leadRepository.updateStatus(leadId, status);
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function updateLeadDetailsAction(leadId: string, data: Partial<LeadProps>) {
    try {
        await leadDependencies.leadRepository.update(leadId, data);
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch (error) {
        console.error("Error updating lead details:", error);
        return { success: false, error: "Failed to update lead" };
    }
}

export async function deleteLeadAction(leadId: string) {
    try {
        await leadDependencies.leadRepository.delete(leadId);
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch (error) {
        console.error("Error deleting lead:", error);
        return { success: false, error: "Failed to delete lead" };
    }
}

export async function createMockLeadsAction() {
    try {
        const mockLeads: LeadPersistence[] = [
            { id: 'l1', name: 'Juan Perez', email: 'juan@example.com', status: 'new', source: 'Web', createdAt: Date.now(), updatedAt: Date.now(), interactions: [], score: 10 },
            { id: 'l2', name: 'Maria Lopez', email: 'maria@example.com', status: 'contacted', source: 'Referral', createdAt: Date.now(), updatedAt: Date.now(), interactions: [], score: 20 },
            { id: 'l3', name: 'Carlos Garcia', email: 'carlos@example.com', status: 'viewing', source: 'Portal', createdAt: Date.now(), updatedAt: Date.now(), interactions: [], score: 30 },
        ];

        // Using repository save for each (Repo pattern compliance > Performance for mocks)
        await Promise.all(mockLeads.map(data => {
            const lead = Lead.fromPersistence(data);
            return leadDependencies.leadRepository.save(lead);
        }));

        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch (error) {
        console.error("Mock creation failed", error);
        return { success: false };
    }
}

// --- Dynamics CRM Config Actions ---

const DEFAULT_PIPELINE: CRMConfig = {
    id: 'default',
    updatedAt: Date.now(),
    customFields: [],
    pipelines: [
        {
            id: 'main-pipeline',
            name: 'Sales Pipeline',
            stages: [
                { id: 'new', label: 'New', color: 'bg-slate-500', order: 0 },
                { id: 'contacted', label: 'Contacted', color: 'bg-blue-500', order: 1 },
                { id: 'qualified', label: 'Qualified', color: 'bg-amber-500', order: 2 },
                { id: 'viewing', label: 'Viewing', color: 'bg-purple-500', order: 3 },
                { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-500', order: 4 },
                { id: 'closed', label: 'Closed Won', color: 'bg-emerald-500', order: 5 },
                { id: 'lost', label: 'Closed Lost', color: 'bg-red-500', order: 6 },
            ]
        }
    ]
};

export async function getCRMConfigAction() {
    try {
        const repo = new FirestoreCRMRepository();
        let config = await repo.getConfig('default');

        if (!config) {
            // Seed defaults
            await repo.saveConfig(DEFAULT_PIPELINE);
            config = DEFAULT_PIPELINE;
        }

        return { success: true, config };
    } catch (error) {
        console.error("Error fetching CRM config", error);
        return { success: false, error: "Failed to fetch config" };
    }
}

export async function updateCRMConfigAction(config: CRMConfig) {
    try {
        const repo = new FirestoreCRMRepository();
        config.updatedAt = Date.now();
        await repo.saveConfig(config);
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch (error) {
        console.error("Error saving CRM config", error);
        return { success: false, error: "Failed to save config" };
    }
}
