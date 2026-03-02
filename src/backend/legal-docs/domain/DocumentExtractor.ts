import { Property } from "@/backend/property/domain/Property";
import { DocumentTemplate } from "../domain/DocumentTemplate";
import { LegalProfile } from "./LegalProfile";
import { TransactionPreset } from "./TransactionPreset";

export interface DocumentExtractor {
    extractData(
        conversationContext: string,
        property: Property,
        template: DocumentTemplate,
        profile?: LegalProfile | null,
        preset?: TransactionPreset | null,
        lead?: any | null // CRM Lead context
    ): Promise<{ data: Record<string, any>; confidence: Record<string, number> }>;
}
