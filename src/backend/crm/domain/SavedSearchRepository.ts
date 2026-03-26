import { SavedSearch } from "./SavedSearch";

export interface SavedSearchRepository {
    save(savedSearch: SavedSearch): Promise<void>;
    findById(id: string): Promise<SavedSearch | null>;
    findByLeadId(leadId: string): Promise<SavedSearch[]>;
    findAllActive(): Promise<SavedSearch[]>;
    delete(id: string): Promise<void>;
}
