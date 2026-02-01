import { CRMConfig } from "../../domain/CRMConfig";
import { CRMRepository } from "../../domain/CRMRepository";

export class SaveCRMConfigService {
    constructor(private readonly repository: CRMRepository) { }

    async execute(config: CRMConfig): Promise<void> {
        // Validation could go here
        config.updatedAt = Date.now();
        await this.repository.saveConfig(config);
    }
}
