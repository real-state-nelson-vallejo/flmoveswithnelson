"use server";

import { CreateProperty } from "@/backend/property/application/CreateProperty";
import { Property } from "@/backend/property/domain/Property";
import { propertyDependencies } from "@/backend/property/dependencies";
import { SearchProperties } from "@/backend/property/application/SearchProperties";

import { GeneratePropertyDescription } from "@/backend/property/application/GeneratePropertyDescription";

// Instantiate Use Cases with dependencies
const createPropertyUseCase = new CreateProperty(propertyDependencies.propertyRepository);
const searchPropertiesUseCase = new SearchProperties(propertyDependencies.propertyRepository);
const generateDescriptionUseCase = new GeneratePropertyDescription(propertyDependencies.contentGenerator);


// DTOs
export type CreatePropertyDTO = Omit<Property, "id" | "createdAt" | "updatedAt">;

// Actions

export async function createPropertyAction(data: CreatePropertyDTO) {
    try {
        const property = await createPropertyUseCase.execute(data);
        return { success: true, property };
    } catch (error) {
        console.error("Error creating property:", error);
        return { success: false, error: "Failed to create property" };
    }
}

export async function getPropertiesAction() {
    try {
        // SearchProperties use case might imply searching, let's see. 
        // If it returns all when query is empty, perfect.
        const properties = await searchPropertiesUseCase.execute("");
        // If SearchProperties is strictly search, I might need a "GetAllProperties" use case or expose repo directly (less pure).
        // Let's assume search("") returns all based on my repo implementation.
        return { success: true, properties };
    } catch (error) {
        console.error("Error fetching properties:", error);
        return { success: false, error: "Failed to fetch properties" };
    }
}

export async function generateDescriptionAction(data: {
    title: string;
    location: string;
    features: string[];
    specs: { beds: number; baths: number; area: number };
    type: string;
}) {
    try {
        const description = await generateDescriptionUseCase.execute(data);
        return { success: true, description };
    } catch (error) {
        console.error("Error generating description:", error);
        return { success: false, error: "Failed to generate description" };
    }
}
