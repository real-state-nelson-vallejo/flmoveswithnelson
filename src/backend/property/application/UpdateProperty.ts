import { PropertyProps } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";

export class UpdateProperty {
    constructor(private readonly propertyRepository: PropertyRepository) { }

    async execute(data: { id: string } & Partial<Omit<PropertyProps, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
        const existing = await this.propertyRepository.findById(data.id);
        if (!existing) {
            throw new Error(`Property with id ${data.id} not found`);
        }

        existing.update(data);
        await this.propertyRepository.save(existing);
    }
}
