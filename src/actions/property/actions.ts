"use server";

import { unstable_cache } from "next/cache";
import { CreateProperty } from "@/backend/property/application/CreateProperty";
import { propertyDependencies } from "@/backend/property/dependencies";
import { SearchProperties } from "@/backend/property/application/SearchProperties";
import { GeneratePropertyDescription } from "@/backend/property/application/GeneratePropertyDescription";
import { DeleteProperty } from "@/backend/property/application/DeleteProperty";
import { UpdateProperty } from "@/backend/property/application/UpdateProperty";
import { GetPropertyBySlug } from "@/backend/property/application/GetPropertyBySlug";
import { GetAdjacentProperties } from "@/backend/property/application/GetAdjacentProperties";
// Removed unused import
import { PropertyDTO } from "@/types/property";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";
import { serializeFirestoreData } from "@/lib/utils";
import type { HomeSection } from "@/lib/schemas/propertySchema";

// Instantiate Use Cases with dependencies
const createPropertyUseCase = new CreateProperty(propertyDependencies.propertyRepository);
const searchPropertiesUseCase = new SearchProperties(propertyDependencies.propertyRepository);
const generateDescriptionUseCase = new GeneratePropertyDescription(propertyDependencies.contentGenerator);
const deletePropertyUseCase = new DeleteProperty(propertyDependencies.propertyRepository);
const updatePropertyUseCase = new UpdateProperty(propertyDependencies.propertyRepository);
const getPropertyBySlugUseCase = new GetPropertyBySlug(propertyDependencies.propertyRepository);
const getAdjacentPropertiesUseCase = new GetAdjacentProperties(propertyDependencies.propertyRepository);
// const analyzePropertyUseCase = new AnalyzeProperty(propertyDependencies.propertyRepository, propertyDependencies.contentGenerator);

// Manual property creation from the dashboard form doesn't touch tagging/archive fields.
// Those are set only by the editorial tag editor (Fase 4) and the sync worker (Fase 6).
export type CreatePropertyDTO = Omit<PropertyDTO, "id" | "createdAt" | "updatedAt" | "curatedAt" | "archivedAt">;

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

/**
 * Paginated variant — hits FirestorePropertyRepository.searchPage() directly and
 * returns a cursor so callers can fetch the next page without re-scanning.
 * Use this in heavy listings (public /properties, dashboard grid).
 */
export async function getPropertiesPageAction(filter: PropertyFilter = {}) {
    try {
        const result = await propertyDependencies.propertyRepository.searchPage(filter);
        return {
            success: true as const,
            properties: result.properties.map(p => p.toDTO()),
            nextCursor: result.nextCursor,
        };
    } catch (error) {
        console.error("Error fetching paginated properties:", error);
        return { success: false as const, error: "Failed to fetch properties" };
    }
}

/**
 * Internal helper wrapped in unstable_cache — TTL of 60s reduces Firestore reads
 * on the public home. On-demand invalidation via revalidateTag('home-featured')
 * is triggered by the tag editor API and the sync worker to flush the cache.
 *
 * Resilient to three transient states:
 *  - Composite indexes still building after a deploy.
 *  - Legacy docs without `archived: false` (pre-backfill).
 *  - The two primary queries returning empty (new install, bad filter, etc.).
 *
 * Falls back to "latest N regardless of tagging" so the home is never completely empty.
 */
const getFeaturedPropertiesCached = unstable_cache(
    async (): Promise<PropertyDTO[]> => {
        const AGENT_ID = process.env.NEXT_PUBLIC_NELSON_AGENT_ID;
        const FEED_SIZE = 12;

        type P = Awaited<ReturnType<typeof searchPropertiesUseCase.execute>>[number];

        const runSafe = async (filter: Parameters<typeof searchPropertiesUseCase.execute>[0]): Promise<P[]> => {
            try {
                return await searchPropertiesUseCase.execute(filter);
            } catch (err: any) {
                console.warn("[getFeaturedPropertiesCached] query failed:", err.message || err);
                return [];
            }
        };

        const [tagged, agentOwned] = await Promise.all([
            runSafe({ homeSection: 'featured', limit: FEED_SIZE }),
            AGENT_ID ? runSafe({ agentId: AGENT_ID, limit: FEED_SIZE }) : Promise.resolve([]),
        ]);

        const byCreatedAtDesc = (a: { toDTO(): { createdAt: number } }, b: { toDTO(): { createdAt: number } }) =>
            b.toDTO().createdAt - a.toDTO().createdAt;

        const seen = new Set<string>();
        const collect = (items: P[]) => {
            const out: P[] = [];
            for (const p of items) {
                if (!seen.has(p.id)) {
                    seen.add(p.id);
                    out.push(p);
                }
            }
            return out;
        };

        let merged: P[] = [
            ...collect([...tagged].sort(byCreatedAtDesc)),
            ...collect([...agentOwned].sort(byCreatedAtDesc)),
        ];

        // Last-resort fallback — latest props regardless of tag/agent/archive.
        // Uses single-field index on `createdAt`, which Firestore auto-provides,
        // so it works even before any composite index is built.
        if (merged.length === 0) {
            const latest = await runSafe({ includeArchived: true, limit: FEED_SIZE });
            merged = collect([...latest].sort(byCreatedAtDesc));
        }

        return merged.slice(0, FEED_SIZE).map(p => p.toDTO());
    },
    ['featured-properties'],
    { revalidate: 60, tags: ['home-featured'] },
);

export async function getFeaturedPropertiesAction() {
    try {
        const properties = await getFeaturedPropertiesCached();
        return { success: true, properties };
    } catch (error) {
        console.error("Error fetching featured properties:", error);
        return { success: false, error: "Failed to fetch featured properties" };
    }
}

/**
 * Fetch properties for a specific home section (Fase 4).
 * Used for section-specific blocks on the home page (e.g. "Luxury Picks", "Waterfront Collection").
 * Intentionally has NO fallback — if the section has no props tagged, the UI should hide the block.
 * Cached with a short TTL to keep public pages fast.
 */
const getBySectionCached = unstable_cache(
    async (section: HomeSection): Promise<PropertyDTO[]> => {
        const properties = await searchPropertiesUseCase.execute({ homeSection: section });
        const sorted = properties.sort((a, b) => b.toDTO().createdAt - a.toDTO().createdAt);
        return sorted.map(p => p.toDTO());
    },
    ['properties-by-home-section'],
    { revalidate: 60, tags: ['home-sections'] },
);

export async function getPropertiesByHomeSectionAction(section: HomeSection) {
    try {
        const properties = await getBySectionCached(section);
        return { success: true, properties };
    } catch (error) {
        console.error(`Error fetching properties for section ${section}:`, error);
        return { success: false, error: "Failed to fetch section properties" };
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
        let property = await getPropertyBySlugUseCase.execute(slug);

        if (!property) {
            // Fallback: If slug is not found, maybe it's an old ID
            property = await propertyDependencies.propertyRepository.findById(slug);
        }

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

/**
 * Fetch similar properties for a property detail page: same city + price within ±20%.
 * Uses the composite index `(City ASC, archived ASC, ListPrice ASC)` — 1 query,
 * ~5 reads instead of the full-collection scan the previous implementation did.
 */
export async function getSimilarPropertiesAction(propertyId: string, limit: number = 3) {
    try {
        const current = await propertyDependencies.propertyRepository.findById(propertyId);
        if (!current) return { success: false as const, error: "Property not found" };

        const similar = await propertyDependencies.propertyRepository.findSimilar(current, limit);

        return { success: true as const, properties: similar.map(p => p.toDTO()) };
    } catch (error) {
        console.error("Error fetching similar properties:", error);
        return { success: false as const, error: "Failed to fetch similar properties" };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function analyzePropertyContentAction(data: any, propertyId?: string) {
    try {
        const analysis = await propertyDependencies.contentGenerator.analyzeProperty(data);
        return {
            success: true,
            analysis
        };
    } catch (error) {
        console.error("Error analyzing property content:", error);
        return { success: false, error: "Failed to analyze property content" };
    }
}
