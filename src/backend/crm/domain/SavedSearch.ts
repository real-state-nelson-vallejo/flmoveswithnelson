import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";

export interface SavedSearchProps {
    id: string;
    leadId: string;
    searchCriteria: PropertyFilter;
    frequency: 'real-time' | 'daily' | 'weekly';
    active: boolean;
    createdAt: number;
    updatedAt: number;
}

export class SavedSearch {
    private constructor(private props: SavedSearchProps) {}

    static create(data: { leadId: string; searchCriteria: PropertyFilter; frequency?: 'real-time' | 'daily' | 'weekly' }): SavedSearch {
        const now = Date.now();
        return new SavedSearch({
            id: crypto.randomUUID(),
            leadId: data.leadId,
            searchCriteria: data.searchCriteria,
            frequency: data.frequency || 'real-time',
            active: true,
            createdAt: now,
            updatedAt: now
        });
    }

    static fromPersistence(data: any): SavedSearch {
        return new SavedSearch({
            id: data.id,
            leadId: data.leadId,
            searchCriteria: data.searchCriteria || {},
            frequency: data.frequency || 'real-time',
            active: data.active ?? true,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt
        });
    }

    toPersistence(): any {
        return {
            ...this.props
        };
    }

    toDTO(): any {
        return {
            ...this.props
        };
    }

    // Business Logic
    deactivate(): void {
        this.props.active = false;
        this.touch();
    }

    private touch(): void {
        this.props.updatedAt = Date.now();
    }

    get id() { return this.props.id; }
    get leadId() { return this.props.leadId; }
    get searchCriteria() { return this.props.searchCriteria; }
    get frequency() { return this.props.frequency; }
    get active() { return this.props.active; }
}
