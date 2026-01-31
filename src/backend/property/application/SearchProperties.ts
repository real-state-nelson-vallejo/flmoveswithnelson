import { Property } from "../domain/Property";
import { PropertyRepository } from "../domain/PropertyRepository";

export class SearchProperties {
    constructor(private readonly repository: PropertyRepository) { }

    async execute(query: string = ""): Promise<Property[]> {
        if (!query) {
            return this.repository.findAll();
        }
        return this.repository.search(query);
    }
}
