import { LeadDTO } from "../infrastructure/dto/LeadDTO";
import { LeadPersistence } from "../infrastructure/dto/LeadPersistence";
import { Interaction, LeadStatus, LEAD_STATUSES } from "@/types/lead";

export type { Interaction, LeadStatus };
export { LEAD_STATUSES };

export interface LeadProps {
    id: string;
    name: string;
    email: string;
    phone?: string | undefined;
    status: LeadStatus;
    source: string;
    propertyId?: string | undefined;
    notes?: string | undefined;
    interactions: Interaction[];
    score: number;
    createdAt: number;
    updatedAt: number;
}

export class Lead {
    private constructor(private props: LeadProps) { }

    static create(data: { name: string; email: string; phone?: string | undefined; source?: string | undefined; }): Lead {
        const now = Date.now();
        return new Lead({
            id: crypto.randomUUID(),
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: 'new',
            source: data.source || 'web',
            interactions: [],
            score: 0,
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: LeadPersistence): Lead {
        return new Lead({
            ...data,
            interactions: data.interactions || [], // Ensure array
            score: data.score || 0
        });
    }

    toPersistence(): LeadPersistence {
        return {
            ...this.props
        };
    }

    toDTO(): LeadDTO {
        return {
            id: this.props.id,
            name: this.props.name,
            email: this.props.email,
            phone: this.props.phone,
            status: this.props.status,
            source: this.props.source,
            propertyId: this.props.propertyId,
            notes: this.props.notes,
            score: this.props.score,
            interactions: this.props.interactions,
            createdAt: this.props.createdAt,
            updatedAt: this.props.updatedAt
        };
    }

    // Business Methods
    addInteraction(type: Interaction['type'], details?: string, propertyId?: string): void {
        this.props.interactions.push({
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            type,
            details,
            propertyId
        });
        this.updateScore(type);
        this.touch();
    }

    updateStatus(newStatus: LeadStatus): void {
        this.props.status = newStatus;
        this.touch();
    }

    private updateScore(interactionType: Interaction['type']): void {
        const scores = {
            'view_property': 5,
            'whatsapp_click': 15,
            'contact_request': 25
        };
        this.props.score += scores[interactionType] || 0;
    }

    private touch(): void {
        this.props.updatedAt = Date.now();
    }

    // Getters
    get id() { return this.props.id; }
    get name() { return this.props.name; }
    get email() { return this.props.email; }
    get phone() { return this.props.phone; }
    get status() { return this.props.status; }
    get source() { return this.props.source; }
    get interactions() { return [...this.props.interactions]; }
    get score() { return this.props.score; }
}
