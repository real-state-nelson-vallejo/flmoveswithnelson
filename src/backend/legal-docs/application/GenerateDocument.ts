import { DocumentConfiguration } from "../infrastructure/DocumentConfiguration";
import { PdfLibDocumentGenerator } from "../infrastructure/PdfLibDocumentGenerator";
import { GeminiDocumentExtractor } from "../infrastructure/GeminiDocumentExtractor";
import { LegalDocument, DocumentType } from "../domain/LegalDocument";
import { Property } from "@/backend/property/domain/Property";

export class GenerateDocument {
    private generator: PdfLibDocumentGenerator;
    private extractor: GeminiDocumentExtractor;

    constructor() {
        this.generator = new PdfLibDocumentGenerator();
        this.extractor = new GeminiDocumentExtractor();
    }

    async execute(input: {
        propertyId: string;
        templateId: string;
        userContext?: string;
        existingData?: Record<string, unknown>; // If user already reviewed/edited
        property?: Property; // Optimization to avoid refetching if already available
    }): Promise<{ document: LegalDocument; pdfBuffer: Buffer }> {

        const template = await DocumentConfiguration.getTemplate(input.templateId);

        // 1. Prepare Data
        const data = input.existingData || {};

        // If data is missing or we want AI to fill:
        // Ideally we check if we need to run AI. 
        // For now, if no existingData is fully provided, we assume we might need to extract.
        // But the Use Case might just be "Generate PDF from this Data".
        // The "Extraction" step is usually previous to this.

        // Let's assume this Use Case is "Final Generation". 
        // But if we want it to be "Smart Generation", we can integrate extraction here.

        // Pattern: 
        // 1. User asks to create document -> AI Extractor fills draft -> returns to UI
        // 2. User edits draft -> Submit -> GenerateDocument (this use case) -> PDF

        // So this use case should primarily focus on PDF generation from data.
        // But I will keep the logical link to extraction if needed.

        // Create the Domain Entity
        const document = LegalDocument.create(input.propertyId, template.id as unknown as DocumentType, data);

        // Generate PDF
        const buffer = await this.generator.generate(document, template);

        // Mark as generated (and upload to storage in real app)
        // document.markAsGenerated(storageUrl);

        return { document, pdfBuffer: buffer };
    }
}
