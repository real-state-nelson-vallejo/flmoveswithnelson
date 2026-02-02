import { PropertyRepository } from "../domain/PropertyRepository";

export class DeleteProperty {
    constructor(private readonly propertyRepository: PropertyRepository) { }

    async execute(id: string): Promise<void> {
        await this.propertyRepository.delete(id);
    }
}
