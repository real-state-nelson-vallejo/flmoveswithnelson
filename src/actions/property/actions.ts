"use server";

import { CreateProperty } from "@/backend/property/application/CreateProperty";
import { propertyDependencies } from "@/backend/property/dependencies";
import { SearchProperties } from "@/backend/property/application/SearchProperties";
import { GeneratePropertyDescription } from "@/backend/property/application/GeneratePropertyDescription";
import { DeleteProperty } from "@/backend/property/application/DeleteProperty";
import { UpdateProperty } from "@/backend/property/application/UpdateProperty";
import { GetPropertyBySlug } from "@/backend/property/application/GetPropertyBySlug";
import { GetAdjacentProperties } from "@/backend/property/application/GetAdjacentProperties";
import { PropertyDTO } from "@/types/property";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";

// Instantiate Use Cases with dependencies
const createPropertyUseCase = new CreateProperty(propertyDependencies.propertyRepository);
const searchPropertiesUseCase = new SearchProperties(propertyDependencies.propertyRepository);
const generateDescriptionUseCase = new GeneratePropertyDescription(propertyDependencies.contentGenerator);
const deletePropertyUseCase = new DeleteProperty(propertyDependencies.propertyRepository);
const updatePropertyUseCase = new UpdateProperty(propertyDependencies.propertyRepository);
const getPropertyBySlugUseCase = new GetPropertyBySlug(propertyDependencies.propertyRepository);
const getAdjacentPropertiesUseCase = new GetAdjacentProperties(propertyDependencies.propertyRepository);

export type CreatePropertyDTO = Omit<PropertyDTO, "id" | "createdAt" | "updatedAt">;

// Actions

export async function createPropertyAction(data: CreatePropertyDTO) {
    try {
        const property = await createPropertyUseCase.execute(data);
        return { success: true, property: property.toDTO() };
    } catch (error) {
        console.error("Error creating property:", error);
        return { success: false, error: "Failed to create property" };
    }
}

export async function updatePropertyAction(data: { id: string } & Partial<CreatePropertyDTO>) {
    try {
        await updatePropertyUseCase.execute(data);
        return { success: true };
    } catch (error) {
        console.error("Error updating property:", error);
        return { success: false, error: "Failed to update property" };
    }
}

export async function deletePropertyAction(id: string) {
    try {
        await deletePropertyUseCase.execute(id);
        return { success: true };
    } catch (error) {
        console.error("Error deleting property:", error);
        return { success: false, error: "Failed to delete property" };
    }
}

export async function getPropertiesAction(filter: PropertyFilter = {}) {
    try {
        const properties = await searchPropertiesUseCase.execute(filter);
        return { success: true, properties: properties.map(p => p.toDTO()) };
    } catch (error) {
        console.error("Error fetching properties:", error);
        return { success: false, error: "Failed to fetch properties" };
    }
}

export async function getPropertyBySlugAction(slug: string) {
    try {
        const property = await getPropertyBySlugUseCase.execute(slug);
        if (!property) return { success: false, error: "Property not found" };
        return { success: true, property: property.toDTO() };
    } catch (error) {
        console.error("Error fetching property by slug:", error);
        return { success: false, error: "Failed to fetch property" };
    }
}

export async function generateDescriptionAction({
    title,
    location,
    features,
    specs,
    type
}: {
    title: string;
    location: string;
    features: string[];
    specs: { beds: number; baths: number; area: number };
    type: string;
}) {
    try {
        const description = await generateDescriptionUseCase.execute({ title, location, features, specs, type });
        return { success: true, description };
    } catch (error) {
        console.error("Error generating description:", error);
        return { success: false, error: "Failed to generate description" };
    }
}

export async function getAdjacentPropertiesAction(id: string) {
    try {
        const { prev, next } = await getAdjacentPropertiesUseCase.execute(id);
        return {
            success: true,
            prev: prev ? prev.toDTO() : null,
            next: next ? next.toDTO() : null
        };
    } catch (error) {
        console.error("Error fetching adjacent properties:", error);
        return { success: false, error: "Failed to fetch adjacent properties" };
    }
}
