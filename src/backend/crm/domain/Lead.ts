export interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    status: 'new' | 'contacted' | 'viewing' | 'negotiation' | 'closed';
    source: string;
    propertyId?: string; // Interest in specific property
    notes?: string;
    createdAt: number;
    updatedAt: number;
}

export const LEAD_STATUSES = ['new', 'contacted', 'viewing', 'negotiation', 'closed'] as const;
