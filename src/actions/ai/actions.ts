'use server';

import { GetAgentConfiguration } from "@/backend/ai/application/GetAgentConfiguration";
import { UpdateAgentConfiguration } from "@/backend/ai/application/UpdateAgentConfiguration";
import { GenkitAgentService } from "@/backend/ai/application/GenkitAgentService";
import { FirestoreAgentConfigurationRepository } from "@/backend/ai/infrastructure/FirestoreAgentConfigurationRepository";
import { AgentTool } from "@/backend/ai/domain/AgentConfiguration";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";

// Dependencies
const repository = new FirestoreAgentConfigurationRepository();
const getAgentConfigUseCase = new GetAgentConfiguration(repository);
const updateAgentConfigUseCase = new UpdateAgentConfiguration(repository);
const genkitService = new GenkitAgentService();

export async function getAgentConfig() {
    const config = await getAgentConfigUseCase.execute();
    return {
        systemPrompt: config.systemPrompt,
        enabledTools: config.enabledTools,
        modelParams: config.modelParams
    };
}

export async function updateAgentConfig(data: {
    systemPrompt: string;
    enabledTools: AgentTool[];
    modelParams: { temperature: number; modelName: string };
}) {
    await updateAgentConfigUseCase.execute(data);
    revalidatePath('/dashboard/ai-agent');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function chatWithAgent(message: string, history: any[] = []) {
    try {
        // Resolve admin identity from the Firebase ID token sent by the client.
        // The AgentConfigForm (admin playground) should pass `Authorization: Bearer <idToken>`.
        let adminContext = {
            leadName: 'Admin Playground (anonymous)',
            leadId: 'admin-playground-anon',
            leadNotes: 'Admin is testing the agent via the playground. This is NOT a real lead session.',
        };

        try {
            const reqHeaders = await headers();
            const authHeader = reqHeaders.get('authorization') ?? reqHeaders.get('Authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const idToken = authHeader.slice(7);
                const decoded = await adminAuth.verifyIdToken(idToken);
                adminContext = {
                    leadName: decoded.name || decoded.email || 'Admin',
                    leadId: `admin-${decoded.uid}`,
                    leadNotes: `Admin playground session. uid=${decoded.uid}`,
                };
            }
        } catch (tokenErr) {
            console.warn('[chatWithAgent] Could not verify admin token, using anonymous context:', tokenErr);
        }

        const response = await genkitService.generateResponse({
            message,
            history,
            context: adminContext
        });
        return { success: true, data: response };
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return { error: error.message || "Failed to generate response" };
    }
}
