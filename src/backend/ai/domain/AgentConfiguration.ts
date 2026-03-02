import { AgentConfigurationPersistenceModel } from "../infrastructure/dto/AgentConfigurationPersistence";

export type AgentTool = 'property_search' | 'agenda' | 'market_analysis';

export interface AgentConfigurationProps {
    id: string; // Singleton ID usually
    systemPrompt: string;
    enabledTools: AgentTool[];
    modelParams: {
        temperature: number;
        modelName: string;
    };
    updatedAt: Date;
}

export class AgentConfiguration {
    private constructor(private props: AgentConfigurationProps) { }

    static create(data: {
        systemPrompt: string;
        enabledTools: AgentTool[];
        modelParams: {
            temperature: number;
            modelName: string;
        };
    }): AgentConfiguration {
        return new AgentConfiguration({
            id: 'ai_agent_config', // Singleton ID
            systemPrompt: data.systemPrompt,
            enabledTools: data.enabledTools,
            modelParams: data.modelParams,
            updatedAt: new Date()
        });
    }

    static fromPersistence(data: AgentConfigurationPersistenceModel): AgentConfiguration {
        return new AgentConfiguration({
            id: data.id,
            systemPrompt: data.systemPrompt,
            enabledTools: data.enabledTools as AgentTool[],
            modelParams: data.modelParams,
            updatedAt: new Date(data.updatedAt)
        });
    }

    toPersistence(): AgentConfigurationPersistenceModel {
        return {
            id: this.props.id,
            systemPrompt: this.props.systemPrompt,
            enabledTools: this.props.enabledTools,
            modelParams: this.props.modelParams,
            updatedAt: this.props.updatedAt.getTime()
        };
    }

    update(data: {
        systemPrompt?: string;
        enabledTools?: AgentTool[];
        modelParams?: {
            temperature: number;
            modelName: string;
        };
    }): void {
        if (data.systemPrompt !== undefined) this.props.systemPrompt = data.systemPrompt;
        if (data.enabledTools !== undefined) this.props.enabledTools = data.enabledTools;
        if (data.modelParams !== undefined) this.props.modelParams = data.modelParams;
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = new Date();
    }

    // Getters
    get id() { return this.props.id; }
    get systemPrompt() { return this.props.systemPrompt; }
    get enabledTools() { return [...this.props.enabledTools]; }
    get modelParams() { return { ...this.props.modelParams }; }
    get updatedAt() { return this.props.updatedAt; }
}
