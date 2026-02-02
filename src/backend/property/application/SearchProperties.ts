import { Property } from "../domain/Property";
import { PropertyRepository, PropertyFilter } from "../domain/PropertyRepository";

export class SearchProperties {
    constructor(private propertyRepository: PropertyRepository) { }

    async execute(filter: PropertyFilter | string): Promise<Property[]> {
        // Backward compatibility if needed, or normalize to object
        const finalFilter: PropertyFilter = typeof filter === 'string' ? { query: filter } : filter;
        return this.propertyRepository.search(finalFilter);
    }
}
