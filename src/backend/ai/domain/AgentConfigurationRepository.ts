import { AgentConfiguration } from "./AgentConfiguration";

export interface AgentConfigurationRepository {
    save(config: AgentConfiguration): Promise<void>;
    get(): Promise<AgentConfiguration | null>;
}
