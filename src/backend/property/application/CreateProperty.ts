import { Property, PropertyProps } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";

export type CreatePropertyRequest = Omit<PropertyProps, "id" | "createdAt" | "updatedAt">;

export class CreateProperty {
    constructor(private readonly repository: PropertyRepository) { }

    async execute(data: CreatePropertyRequest): Promise<Property> {
        const newProperty = Property.create(data);
        await this.repository.save(newProperty);
        return newProperty;
    }
}
