"use server";

import { CreateProperty } from "@/backend/property/application/CreateProperty";
import { propertyDependencies } from "@/backend/property/dependencies";
import { SearchProperties } from "@/backend/property/application/SearchProperties";
import { GeneratePropertyDescription } from "@/backend/property/application/GeneratePropertyDescription";
import { DeleteProperty } from "@/backend/property/application/DeleteProperty";
import { UpdateProperty } from "@/backend/property/application/UpdateProperty";
import { GetPropertyBySlug } from "@/backend/property/application/GetPropertyBySlug";
import { GetAdjacentProperties } from "@/backend/property/application/GetAdjacentProperties";
import { AnalyzeProperty } from "@/backend/property/application/AnalyzeProperty";
import { PropertyDTO } from "@/types/property";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";
import { EnrichPropertyData } from "@/backend/market/application/EnrichPropertyData";
import { marketDependencies } from "@/backend/market/dependencies";
import { serializeFirestoreData } from "@/lib/utils";

// Instantiate Use Cases with dependencies
const createPropertyUseCase = new CreateProperty(propertyDependencies.propertyRepository);
const searchPropertiesUseCase = new SearchProperties(propertyDependencies.propertyRepository);
const generateDescriptionUseCase = new GeneratePropertyDescription(propertyDependencies.contentGenerator);
const deletePropertyUseCase = new DeleteProperty(propertyDependencies.propertyRepository);
const updatePropertyUseCase = new UpdateProperty(propertyDependencies.propertyRepository);
const getPropertyBySlugUseCase = new GetPropertyBySlug(propertyDependencies.propertyRepository);
const getAdjacentPropertiesUseCase = new GetAdjacentProperties(propertyDependencies.propertyRepository);
const analyzePropertyUseCase = new AnalyzeProperty(propertyDependencies.propertyRepository, propertyDependencies.contentGenerator);
const enrichPropertyDataUseCase = new EnrichPropertyData(marketDependencies.marketDataService, marketDependencies.marketRepository);

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

export async function getPropertyAction(id: string) {
    try {
        const property = await propertyDependencies.propertyRepository.findById(id);
        if (!property) return { success: false, error: "Property not found" };
        return { success: true, property: property.toDTO() };
    } catch (error) {
        console.error("Error fetching property:", error);
        return { success: false, error: "Failed to fetch property" };
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

export async function analyzePropertyContentAction(data: any, propertyId?: string) {
    try {
        let enrichmentData = null;

        // If we have a propertyId and enough data to fetch/cache, do it.
        // Even if no propertyId, if we have address/zip we could theoretically just fetch without caching,
        // but our use case assumes caching. For New Properties (no ID yet), we might skip or use a temp ID.
        // For the scope of 'Analyze', we usually have form data.

        if (data.location?.address && data.location?.zip) {
            // If propertyId is not provided, we might be in "Create" mode. 
            // We can pass a dummy or temporary ID if we want to test the fetch, 
            // but `EnrichPropertyData` saves to DB using that ID. 
            // Ideally we should separate "Fetch" from "Save", but for now let's only enrich if we have an ID 
            // OR modify the usecase to handle "dry run". 
            // But wait, the user wants "RentCast Integration".

            // Simplification: We will try to fetch using the provided data. 
            // If we don't have an ID, we assume it's a new or unsaved property.
            // For now, let's only run enrichment if we can call the service.

            // Check if we can use a temp ID or if the user provided one.
            const effectiveId = propertyId || 'temp-analysis-' + Date.now();

            try {
                enrichmentData = await enrichPropertyDataUseCase.execute(
                    effectiveId,
                    data.location.address,
                    data.location.city,
                    data.location.state,
                    data.location.zip,
                    data.specs
                );
            } catch (err) {
                console.warn("Failed to enrich property data:", err);
                // Continue without enrichment
            }
        }

        const analysis = await propertyDependencies.contentGenerator.analyzeProperty(data, enrichmentData);
        // Serialize potentially complex objects (Firestore Timestamps) before sending to client
        return {
            success: true,
            analysis,
            enrichmentData: serializeFirestoreData(enrichmentData)
        };
    } catch (error) {
        console.error("Error analyzing property content:", error);
        return { success: false, error: "Failed to analyze property content" };
    }
}
