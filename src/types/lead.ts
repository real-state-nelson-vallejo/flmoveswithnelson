export type LeadStatus = string; // Now a dynamic ID pointing to a CRMStage
export const DEFAULT_LEAD_STATUSES = ['new', 'contacted', 'qualified', 'viewing', 'negotiation', 'closed', 'lost'];

export interface Interaction {
    id: string;
    type: 'view_property' | 'contact_request' | 'whatsapp_click';
    propertyId?: string | undefined;
    timestamp: number;
    details?: string | undefined;
}

export interface LeadDTO {
    id: string;
    name: string;
    email: string;
    phone?: string | undefined;
    status: LeadStatus;
    source: string;
    intent?: string | undefined;
    propertyId?: string | undefined;
    notes?: string | undefined;
    score?: number | undefined;
    interactions?: Interaction[] | undefined;
    createdAt: number;
    updatedAt: number;
}
