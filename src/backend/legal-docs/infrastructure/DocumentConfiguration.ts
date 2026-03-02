import { DocumentTemplate } from "../domain/DocumentTemplate";
import { FirestoreDocumentTemplateRepository } from "./FirestoreDocumentTemplateRepository";

export class DocumentConfiguration {
    static async getTemplate(id: string): Promise<DocumentTemplate> {
        const repo = new FirestoreDocumentTemplateRepository();
        const config = await repo.findById(id);

        if (!config) {
            throw new Error(`Template with ID ${id} not found in database.`);
        }

        return DocumentTemplate.create({
            id: config.id,
            name: config.name,
            description: config.description,
            pdfPath: config.pdfPath,
            fields: config.fields || []
        });
    }

    static async getAllTemplates(): Promise<DocumentTemplate[]> {
        const repo = new FirestoreDocumentTemplateRepository();
        const configs = await repo.findAll();

        return configs.map(config => DocumentTemplate.create({
            id: config.id,
            name: config.name,
            description: config.description,
            pdfPath: config.pdfPath,
            fields: config.fields || []
        }));
    }
}
