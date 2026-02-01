import { FirestoreCRMRepository } from "./infrastructure/FirestoreCRMRepository";
import { GetCRMConfigService } from "./application/services/GetCRMConfigService";
import { SaveCRMConfigService } from "./application/services/SaveCRMConfigService";

export const crmRepository = new FirestoreCRMRepository();

export const crmServices = {
    getConfig: new GetCRMConfigService(crmRepository),
    saveConfig: new SaveCRMConfigService(crmRepository)
};

export const crmDependencies = {
    crmRepository,
    ...crmServices
};
