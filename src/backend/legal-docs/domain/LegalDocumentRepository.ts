import { LegalDocument } from "./LegalDocument";

export interface LegalDocumentRepository {
    save(document: LegalDocument): Promise<void>;
    findById(id: string): Promise<LegalDocument | null>;
    findByPropertyId(propertyId: string): Promise<LegalDocument[]>;
    findAll(): Promise<LegalDocument[]>;
    delete(id: string): Promise<void>;
}
