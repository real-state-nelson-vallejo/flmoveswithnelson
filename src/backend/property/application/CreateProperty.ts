import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";


export class CreateProperty {
    constructor(private readonly repository: PropertyRepository) { }

    async execute(data: Omit<Property, "id" | "createdAt" | "updatedAt">): Promise<Property> {
        const newProperty: Property = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await this.repository.save(newProperty);
        return newProperty;
    }
}
