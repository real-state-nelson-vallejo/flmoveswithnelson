export interface AgentConfigurationPersistenceModel {
    id: string;
    systemPrompt: string;
    enabledTools: string[];
    modelParams: {
        temperature: number;
        modelName: string;
    };
    updatedAt: number;
}
