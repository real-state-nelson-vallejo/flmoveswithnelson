import { DocumentTemplateProps } from "./DocumentTemplate";

export interface DocumentTemplateRepository {
    save(template: DocumentTemplateProps): Promise<void>;
    findById(id: string): Promise<DocumentTemplateProps | null>;
    findAll(): Promise<DocumentTemplateProps[]>;
    delete(id: string): Promise<void>;
}
