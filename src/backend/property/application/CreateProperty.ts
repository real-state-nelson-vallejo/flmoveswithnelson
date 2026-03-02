import { Property, PropertyProps } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";
import { VectorizePropertyService } from "./VectorizePropertyService";

export type CreatePropertyRequest = Omit<PropertyProps, "id" | "createdAt" | "updatedAt">;

export class CreateProperty {
    constructor(private readonly repository: PropertyRepository) { }

    async execute(data: CreatePropertyRequest): Promise<Property> {
        const newProperty = Property.create(data);
        await this.repository.save(newProperty);

        // Trigger Vectorization (Fire & Forget or Await safely)
        // We await it here to ensure consistency, but catch errors to not fail the creation if vector DB is down
        try {
            const vectorizer = new VectorizePropertyService();
            await vectorizer.execute(newProperty);
        } catch (e) {
            console.error("Failed to vectorize property after creation", e);
        }

        return newProperty;
    }
}
