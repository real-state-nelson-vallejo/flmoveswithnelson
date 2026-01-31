import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";

export class InMemoryPropertyRepository implements PropertyRepository {
    private properties: Map<string, Property> = new Map();

    async save(property: Property): Promise<void> {
        this.properties.set(property.id, property);
    }

    async findById(id: string): Promise<Property | null> {
        return this.properties.get(id) || null;
    }

    async findAll(): Promise<Property[]> {
        return Array.from(this.properties.values());
    }

    async search(query: string): Promise<Property[]> {
        const lowercaseQuery = query.toLowerCase();
        return Array.from(this.properties.values()).filter(
            (p) =>
                p.title.toLowerCase().includes(lowercaseQuery) ||
                p.description.toLowerCase().includes(lowercaseQuery) ||
                p.location.city.toLowerCase().includes(lowercaseQuery)
        );
    }
}
