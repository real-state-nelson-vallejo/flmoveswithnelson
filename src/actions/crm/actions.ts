'use server';

import { conversationRepository } from "@/backend/crm/dependencies";
import { Message } from "@/backend/crm/domain/Conversation";
import { revalidatePath } from "next/cache";

export async function getConversationsAction(userId: string) {
    try {
        const conversations = await conversationRepository.getConversations(userId);
        return { success: true, data: conversations };
    } catch (error) {
        console.error("Error fetching conversations:", error);
        return { success: false, error: "Failed to fetch conversations" };
    }
}

export async function getMessagesAction(conversationId: string) {
    try {
        const messages = await conversationRepository.getMessages(conversationId);
        return { success: true, data: messages };
    } catch (error) {
        console.error("Error fetching messages:", error);
        return { success: false, error: "Failed to fetch messages" };
    }
}

export async function sendMessageAction(message: Message) {
    try {
        await conversationRepository.saveMessage(message);
        revalidatePath('/dashboard/inbox');
        return { success: true };
    } catch (error) {
        console.error("Error sending message:", error);
        return { success: false, error: "Failed to send message" };
    }
}

// --- AI Integration ---

import { chatbotFlow } from "@/backend/ai/infrastructure/genkit/flows/chatbotFlow";

export async function getAvailableModelsAction() {
    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        if (!apiKey) return { success: false, error: "No API Key" };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error("Failed to fetch models");

        const data = await response.json();
        // Filter for gemini models only
        const models = (data.models || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((m: any) => m.name.includes('gemini'))
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((m: any) => ({
                id: m.name.replace('models/', ''),
                name: m.displayName
            }));

        return { success: true, models };
    } catch (error) {
        console.error("List Models Error:", error);
        return { success: false, error: "Failed to list models" };
    }
}

export async function generateAIReplyAction(conversationId: string, modelId?: string) {
    try {
        // 1. Fetch conversation history
        const messages = await conversationRepository.getMessages(conversationId, 10); // last 10

        // 2. Format history for Genkit
        // Repo: return snapshot.docs.map(...).reverse(); -> So [Oldest, ..., Newest]

        const validHistory = messages.slice(0, -1).map(m => ({
            role: (m.senderRole === 'user' ? 'user' : 'model') as 'user' | 'model',
            content: [{ text: m.content }]
        }));

        // 3. Call the Flow directly
        // Genkit requires the plugin namespace for models usually (e.g. googleai/gemini-1.5-flash)
        // The list returns raw API names. We need to prepend the provider prefix.
        const providerPrefix = 'googleai/';
        const fullModelId = modelId && !modelId.startsWith(providerPrefix)
            ? `${providerPrefix}${modelId}`
            : (modelId || 'googleai/gemini-2.5-flash');

        console.log(`[generateAIReplyAction] Using model: ${fullModelId}`);

        const aiText = await chatbotFlow({
            history: validHistory,
            userInput: messages[messages.length - 1].content,
            modelId: fullModelId
        });

        // 4. Save AI Response
        const aiMessage: Message = {
            id: crypto.randomUUID(),
            conversationId,
            senderId: 'system-ai',
            senderRole: 'system',
            content: aiText,
            type: 'text',
            createdAt: Date.now(),
            readBy: []
        };

        await conversationRepository.saveMessage(aiMessage);
        revalidatePath('/dashboard/inbox');

        return { success: true };

    } catch (error) {
        console.error("AI Gen Error:", error);
        return { success: false };
    }
}
export async function startConversationAction(participants: string[], initialMessage: string, metadata?: Record<string, unknown>) {
    try {
        const conversationId = crypto.randomUUID();
        const messageId = crypto.randomUUID();
        const now = Date.now();

        const message: Message = {
            id: messageId,
            conversationId,
            senderId: participants[0], // Assuming first is sender
            senderRole: 'user', // Default
            content: initialMessage,
            type: 'text',
            createdAt: now,
            readBy: [participants[0]]
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conversation: any = { // Using any to bypass strict type for now or construct properly
            id: conversationId,
            participants,
            lastMessage: message,
            unreadCount: {}, // Logic needed
            status: 'active',
            channel: 'web_chat',
            metadata,
            createdAt: now,
            updatedAt: now
        };

        await conversationRepository.createConversation(conversation);
        await conversationRepository.saveMessage(message);

        revalidatePath('/dashboard/inbox');
        return { success: true, conversationId };
    } catch (error) {
        console.error("Error starting conversation:", error);
        return { success: false, error: "Failed to start conversation" };
    }
}
// --- Leads Actions (CRM) ---

import { Lead } from "@/backend/crm/domain/Lead";
// We'll need a real repository eventually, for now let's mock or use a simple firestore fetch if possible
// importing adminDb to do direct queries since repository isn't fully set up for Leads yet
import { adminDb } from "@/lib/firebase/admin";
import { LeadSchema } from "@/lib/schemas/leadSchema";
import { QueryDocumentSnapshot } from "firebase-admin/firestore";

// ...

export async function getLeadsAction() {
    try {
        const snapshot = await adminDb.collection('leads').get();
        const leads = snapshot.docs.reduce((acc: Lead[], doc: QueryDocumentSnapshot) => {
            const result = LeadSchema.safeParse(doc.data());
            if (result.success) {
                acc.push(result.data);
            } else {
                console.warn(`Invalid lead data for ${doc.id}`, result.error);
            }
            return acc;
        }, []);
        return { success: true, leads };
    } catch (error) {
        console.error("Error fetching leads:", error);
        return { success: false, error: "Failed" };
    }
}

export async function updateLeadStatusAction(leadId: string, status: Lead['status']) {
    try {
        await adminDb.collection('leads').doc(leadId).update({ status, updatedAt: Date.now() });
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch {
        return { success: false };
    }
}

export async function createMockLeadsAction() {
    try {
        const mockLeads: Lead[] = [
            { id: 'l1', name: 'Juan Perez', email: 'juan@example.com', status: 'new', source: 'Web', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'l2', name: 'Maria Lopez', email: 'maria@example.com', status: 'contacted', source: 'Referral', createdAt: Date.now(), updatedAt: Date.now() },
            { id: 'l3', name: 'Carlos Garcia', email: 'carlos@example.com', status: 'viewing', source: 'Portal', createdAt: Date.now(), updatedAt: Date.now() },
        ];

        const batch = adminDb.batch();
        mockLeads.forEach(lead => {
            const ref = adminDb.collection('leads').doc(lead.id);
            batch.set(ref, lead);
        });
        await batch.commit();
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch {
        return { success: false };
    }
}
