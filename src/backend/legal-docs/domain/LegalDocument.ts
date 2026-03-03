import crypto from 'crypto';

export type DocumentType = 'exclusive-right-to-lease' | 'residential-lease';
export type DocumentStatus = 'draft' | 'generated' | 'signed' | 'voided';

export interface LegalDocumentProps {
    id: string;
    propertyId: string;
    leadId?: string; // Links document to a CRM lead (tenant/buyer)
    type: DocumentType;
    status: DocumentStatus;
    data: Record<string, unknown>; // JSON data mapped to form fields
    fieldConfidence?: Record<string, number>; // AI confidence per field (0-1)
    generatedPdfUrl?: string;
    signedPdfUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

export class LegalDocument {
    private constructor(private readonly props: LegalDocumentProps) { }

    static create(
        propertyId: string,
        type: DocumentType,
        initialData: Record<string, unknown> = {},
        leadId?: string
    ): LegalDocument {
        const now = new Date();
        const props: LegalDocumentProps = {
            id: crypto.randomUUID(),
            propertyId,
            type,
            status: 'draft',
            data: initialData,
            createdAt: now,
            updatedAt: now,
        };
        if (leadId) props.leadId = leadId;

        return new LegalDocument(props);
    }

    static fromPersistence(props: LegalDocumentProps): LegalDocument {
        return new LegalDocument({
            ...props,
            createdAt: new Date(props.createdAt),
            updatedAt: new Date(props.updatedAt),
        });
    }

    toPersistence(): Record<string, unknown> {
        return {
            ...this.props,
            createdAt: this.props.createdAt.getTime(),
            updatedAt: this.props.updatedAt.getTime(),
        };
    }

    updateData(data: Record<string, unknown>, confidence?: Record<string, number>): void {
        this.props.data = { ...this.props.data, ...data };
        if (confidence) {
            this.props.fieldConfidence = { ...this.props.fieldConfidence, ...confidence };
        }
        this.touch();
    }

    markAsGenerated(pdfUrl: string): void {
        this.props.status = 'generated';
        this.props.generatedPdfUrl = pdfUrl;
        this.touch();
    }

    // Getters
    get id() { return this.props.id; }
    get propertyId() { return this.props.propertyId; }
    get leadId() { return this.props.leadId; }
    get type() { return this.props.type; }
    get status() { return this.props.status; }
    get data() { return { ...this.props.data }; }
    get fieldConfidence() { return { ...this.props.fieldConfidence }; }
    get generatedPdfUrl() { return this.props.generatedPdfUrl; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    private touch(): void {
        this.props.updatedAt = new Date();
    }
}
