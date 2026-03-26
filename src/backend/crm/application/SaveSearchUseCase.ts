import { SavedSearch, SavedSearchProps } from "../domain/SavedSearch";
import { SavedSearchRepository } from "../domain/SavedSearchRepository";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";

export class SaveSearchUseCase {
    constructor(private savedSearchRepository: SavedSearchRepository) {}

    async execute(data: { leadId: string; searchCriteria: PropertyFilter; frequency?: 'real-time' | 'daily' | 'weekly' }): Promise<SavedSearch> {
        const savedSearch = SavedSearch.create(data);
        await this.savedSearchRepository.save(savedSearch);
        return savedSearch;
    }
}
