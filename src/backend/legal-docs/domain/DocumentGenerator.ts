import { LegalDocument } from "../domain/LegalDocument";
import { DocumentTemplate } from "../domain/DocumentTemplate";

export interface DocumentGenerator {
    generate(document: LegalDocument, template: DocumentTemplate): Promise<Buffer>;
}
