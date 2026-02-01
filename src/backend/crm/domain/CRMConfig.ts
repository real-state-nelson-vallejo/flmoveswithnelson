export interface CRMStage {
    id: string;
    label: string;
    color: string;
    order: number;
}

export interface Pipeline {
    id: string;
    name: string;
    stages: CRMStage[];
}

export interface CRMFieldOptions {
    label: string;
    value: string;
}

export interface CRMField {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'email' | 'phone';
    options?: CRMFieldOptions[]; // For 'select' type
    required?: boolean;
    order: number;
    placeholder?: string;
}

export interface CRMConfig {
    id: string; // e.g. 'default' or workspaceId
    pipelines: Pipeline[];
    customFields: CRMField[]; // Global custom fields for Leads
    settings?: {
        defaultPipelineId?: string;
        currency?: string;
    };
    updatedAt: number;
}
