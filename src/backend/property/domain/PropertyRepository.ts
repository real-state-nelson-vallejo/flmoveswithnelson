import { Property } from "./Property";

export interface PropertyRepository {
    save(property: Property): Promise<void>;
    findById(id: string): Promise<Property | null>;
    findAll(): Promise<Property[]>;
    search(query: string): Promise<Property[]>;
}
