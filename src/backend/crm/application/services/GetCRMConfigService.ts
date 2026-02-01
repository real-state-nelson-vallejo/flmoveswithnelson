import { CRMConfig } from "../../domain/CRMConfig";
import { CRMRepository } from "../../domain/CRMRepository";

export class GetCRMConfigService {
    constructor(private readonly repository: CRMRepository) { }

    async execute(id: string = 'default'): Promise<CRMConfig | null> {
        return this.repository.getConfig(id);
    }
}
