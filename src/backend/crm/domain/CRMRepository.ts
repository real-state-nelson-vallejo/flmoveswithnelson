import { CRMConfig } from "./CRMConfig";

export interface CRMRepository {
    getConfig(id: string): Promise<CRMConfig | null>;
    saveConfig(config: CRMConfig): Promise<void>;
}
