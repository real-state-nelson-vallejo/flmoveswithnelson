import { AgentConfiguration } from "@/backend/ai/domain/AgentConfiguration";
import { AgentConfigurationRepository } from "@/backend/ai/domain/AgentConfigurationRepository";
import { adminDb } from "@/lib/firebase/admin";
import { AgentConfigurationPersistenceModel } from "./dto/AgentConfigurationPersistence";

const COLLECTION_NAME = "system_settings";
const DOC_ID = "ai_agent_config";

export class FirestoreAgentConfigurationRepository implements AgentConfigurationRepository {
    async save(config: AgentConfiguration): Promise<void> {
        const persistence = config.toPersistence();
        await adminDb.collection(COLLECTION_NAME).doc(DOC_ID).set(persistence);
    }

    async get(): Promise<AgentConfiguration | null> {
        const doc = await adminDb.collection(COLLECTION_NAME).doc(DOC_ID).get();
        if (!doc.exists) return null;

        const data = doc.data() as AgentConfigurationPersistenceModel;
        return AgentConfiguration.fromPersistence(data);
    }
}
