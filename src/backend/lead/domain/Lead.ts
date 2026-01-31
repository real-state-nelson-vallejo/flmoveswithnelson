export interface Interaction {
    id: string;
    type: 'view_property' | 'contact_request' | 'whatsapp_click';
    propertyId?: string;
    timestamp: Date;
    details?: string;
}

export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    interactions: Interaction[];
    status: 'new' | 'contacted' | 'qualified' | 'lost';
    score: number; // For AI Smart Matching
    createdAt: Date;
}
