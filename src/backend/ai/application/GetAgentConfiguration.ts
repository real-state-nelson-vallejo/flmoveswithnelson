import { AgentConfiguration } from "@/backend/ai/domain/AgentConfiguration";
import { AgentConfigurationRepository } from "@/backend/ai/domain/AgentConfigurationRepository";
import { AgentTool } from "@/backend/ai/domain/AgentConfiguration";

export class GetAgentConfiguration {
    constructor(private repository: AgentConfigurationRepository) { }

    async execute(): Promise<AgentConfiguration> {
        const config = await this.repository.get();
        if (config) {
            return config;
        }

        // Return default configuration if none exists
        return AgentConfiguration.create({
            systemPrompt: "You are an expert bilingual virtual assistant for Nelson Vallejo, a top real estate agent in Florida. You speak fluent English and Spanish. You must always respond naturally in the same language the user is using. Be concise, helpful, and proactive in finding properties or scheduling consultations.",
            enabledTools: [] as AgentTool[],
            modelParams: {
                temperature: 0.7,
                modelName: "googleai/gemini-2.5-flash"
            }
        });
    }
}
