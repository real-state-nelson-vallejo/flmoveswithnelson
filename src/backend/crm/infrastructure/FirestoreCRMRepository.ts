import { CRMConfig } from "../domain/CRMConfig";
import { CRMRepository } from "../domain/CRMRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreCRMRepository implements CRMRepository {
    private collection = 'crm_configs';

    async getConfig(id: string): Promise<CRMConfig | null> {
        try {
            const doc = await adminDb.collection(this.collection).doc(id).get();
            if (!doc.exists) return null;
            return doc.data() as CRMConfig;
        } catch (error) {
            console.error("Error fetching CRM config:", error);
            return null;
        }
    }

    async saveConfig(config: CRMConfig): Promise<void> {
        try {
            await adminDb.collection(this.collection).doc(config.id).set(config, { merge: true });
        } catch (error) {
            console.error("Error saving CRM config:", error);
            throw new Error("Failed to save CRM config");
        }
    }
}
