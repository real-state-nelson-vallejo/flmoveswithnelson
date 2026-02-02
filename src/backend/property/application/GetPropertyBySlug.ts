import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";

export class GetPropertyBySlug {
    constructor(private readonly propertyRepository: PropertyRepository) { }

    async execute(slug: string): Promise<Property | null> {
        return this.propertyRepository.findBySlug(slug);
    }
}
