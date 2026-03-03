import { AgentConfiguration, AgentTool } from "@/backend/ai/domain/AgentConfiguration";
import { AgentConfigurationRepository } from "@/backend/ai/domain/AgentConfigurationRepository";

export class UpdateAgentConfiguration {
    constructor(private repository: AgentConfigurationRepository) { }

    async execute(input: {
        systemPrompt?: string;
        enabledTools?: AgentTool[];
        modelParams?: {
            temperature: number;
            modelName: string;
        };
    }): Promise<void> {
        let config = await this.repository.get();

        if (!config) {
            // Create new if doesn't exist (First time setup)
            config = AgentConfiguration.create({
                systemPrompt: input.systemPrompt || "You are a helpful virtual assistant.",
                enabledTools: input.enabledTools || [],
                modelParams: input.modelParams || { temperature: 0.7, modelName: "googleai/gemini-2.5-flash" }
            });
        } else {
            // Update existing
            config.update(input);
        }

        await this.repository.save(config);
    }
}
