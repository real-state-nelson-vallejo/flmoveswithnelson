"use server";

import { SaveSearchUseCase } from "@/backend/crm/application/SaveSearchUseCase";
import { FirestoreSavedSearchRepository } from "@/backend/crm/infrastructure/FirestoreSavedSearchRepository";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";

const repository = new FirestoreSavedSearchRepository();
const saveSearchUseCase = new SaveSearchUseCase(repository);

export async function saveSearchAction(data: { leadId: string; searchCriteria: PropertyFilter; frequency?: 'real-time' | 'daily' | 'weekly' }) {
    try {
        const result = await saveSearchUseCase.execute(data);
        return { success: true, savedSearch: result.toDTO() };
    } catch (error) {
        console.error("Error saving search:", error);
        return { success: false, error: "Failed to save search" };
    }
}
