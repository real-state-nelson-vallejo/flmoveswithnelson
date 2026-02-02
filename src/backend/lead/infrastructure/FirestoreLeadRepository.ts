import { adminDb } from "@/lib/firebase/admin";
import { Lead, LeadProps, LeadStatus } from "../domain/Lead";
import { LeadRepository } from "../domain/LeadRepository";
import { LeadPersistence } from "./dto/LeadPersistence";
import type { QueryDocumentSnapshot, DocumentSnapshot } from "firebase-admin/firestore";

export class FirestoreLeadRepository implements LeadRepository {
    private get collection() {
        return "leads";
    }

    async save(lead: Lead): Promise<void> {
        await adminDb.collection(this.collection).doc(lead.id).set(lead.toPersistence());
    }

    async update(id: string, data: Partial<LeadProps>): Promise<void> {
        await adminDb.collection(this.collection).doc(id).update({
            ...data,
            updatedAt: Date.now()
        });
    }

    async updateStatus(id: string, status: LeadStatus): Promise<void> {
        await this.update(id, { status });
    }

    async findById(id: string): Promise<Lead | null> {
        const doc = await adminDb.collection(this.collection).doc(id).get();
        if (!doc.exists) return null;

        return this.mapDocToLead(doc);
    }

    async findByEmail(email: string): Promise<Lead | null> {
        const snapshot = await adminDb.collection(this.collection).where('email', '==', email).limit(1).get();
        if (snapshot.empty) return null;

        return this.mapDocToLead(snapshot.docs[0]!);
    }

    async findAll(): Promise<Lead[]> {
        const snapshot = await adminDb.collection(this.collection).orderBy("createdAt", "desc").get();

        return snapshot.docs
            .map((doc: QueryDocumentSnapshot) => this.mapDocToLead(doc))
            .filter((lead: Lead | null): lead is Lead => lead !== null);
    }

    private mapDocToLead(doc: DocumentSnapshot | QueryDocumentSnapshot): Lead | null {
        const data = doc.data();
        if (!data) return null;

        // Simplify for now: Trust database or basic cast, enforcing essential fields
        // In strict mode we should use Zod, but schema might need update.
        // Assuming data matches LeadPersistence
        // We cast to LeadPersistence (primitive types) then create Domain Object
        return Lead.fromPersistence({
            id: doc.id,
            ...data
        } as unknown as LeadPersistence);
    }
}
