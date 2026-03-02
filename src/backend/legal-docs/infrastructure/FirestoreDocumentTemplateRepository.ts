import { DocumentTemplateProps } from "../domain/DocumentTemplate";
import { DocumentTemplateRepository } from "../domain/DocumentTemplateRepository";
import { adminDb } from "@/lib/firebase/admin";

export class FirestoreDocumentTemplateRepository implements DocumentTemplateRepository {
    private get collection() {
        return adminDb.collection('document_templates');
    }

    async save(template: DocumentTemplateProps): Promise<void> {
        await this.collection.doc(template.id).set({
            ...template,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    }

    async findById(id: string): Promise<DocumentTemplateProps | null> {
        const doc = await this.collection.doc(id).get();
        if (!doc.exists) return null;

        return doc.data() as DocumentTemplateProps;
    }

    async findAll(): Promise<DocumentTemplateProps[]> {
        const snapshot = await this.collection.get();
        return snapshot.docs.map(doc => doc.data() as DocumentTemplateProps);
    }

    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }
}
