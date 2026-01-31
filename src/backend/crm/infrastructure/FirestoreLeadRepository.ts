import { adminDb } from "@/lib/firebase/admin";
import { Lead } from "../domain/Lead";
import { LeadRepository } from "../domain/LeadRepository";

export class FirestoreLeadRepository implements LeadRepository {
    private collection = "leads";

    async save(lead: Lead): Promise<void> {
        await adminDb.collection(this.collection).doc(lead.id).set(lead);
    }

    async findById(id: string): Promise<Lead | null> {
        const doc = await adminDb.collection(this.collection).doc(id).get();
        if (!doc.exists) return null;
        return doc.data() as Lead;
    }

    async findAll(): Promise<Lead[]> {
        const snapshot = await adminDb.collection(this.collection).orderBy("createdAt", "desc").get();
        return snapshot.docs.map(doc => doc.data() as Lead);
    }

    async updateStatus(id: string, status: Lead['status']): Promise<void> {
        await adminDb.collection(this.collection).doc(id).update({
            status,
            updatedAt: Date.now()
        });
    }
}
