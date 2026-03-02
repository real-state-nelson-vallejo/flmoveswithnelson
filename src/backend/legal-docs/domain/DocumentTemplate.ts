export interface FieldMapping {
    fieldId: string; // e.g., 'property_address', 'owner_name'
    type: 'text' | 'checkbox' | 'date' | 'money';
    page: number;
    rect: { x: number; y: number; width?: number; height?: number }; // PDF coordinates
    originalLabel?: string;
    style?: {
        fontSize?: number;
        font?: 'Helvetica' | 'TimesEx';
        alignment?: 'left' | 'center' | 'right';
    };
}

export interface DocumentTemplateProps {
    id: string; // 'far-erl-11', 'far-rlhd-3x'
    name: string;
    description: string;
    pdfPath: string; // Relative to project root or absolute
    fields: FieldMapping[];
}

export class DocumentTemplate {
    private constructor(private readonly props: DocumentTemplateProps) { }

    static create(props: DocumentTemplateProps): DocumentTemplate {
        return new DocumentTemplate(props);
    }

    get id() { return this.props.id; }
    get name() { return this.props.name; }
    get description() { return this.props.description; }
    get pdfPath() { return this.props.pdfPath; }
    get fields() { return [...this.props.fields]; }

    getField(fieldId: string): FieldMapping | undefined {
        return this.props.fields.find(f => f.fieldId === fieldId);
    }
}
