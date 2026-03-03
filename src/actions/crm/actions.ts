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

import { Lead } from "@/backend/lead/domain/Lead";
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
