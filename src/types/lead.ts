export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'viewing' | 'negotiation' | 'closed' | 'lost';
export const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'viewing', 'negotiation', 'closed', 'lost'];

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
    status: 'new' | 'contacted' | 'viewing' | 'negotiation' | 'closed' | 'qualified' | 'lost';
    source: string;
    propertyId?: string | undefined;
    notes?: string | undefined;
    score?: number | undefined;
    interactions?: Interaction[] | undefined;
    createdAt: number;
    updatedAt: number;
}
