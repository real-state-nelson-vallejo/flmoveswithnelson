import { PropertyRepository } from "../domain/PropertyRepository";
import { Property } from "../domain/Property";

export class GetAdjacentProperties {
    constructor(private propertyRepository: PropertyRepository) { }

    async execute(id: string): Promise<{ prev: Property | null; next: Property | null }> {
        return this.propertyRepository.getAdjacentProperties(id);
    }
}
