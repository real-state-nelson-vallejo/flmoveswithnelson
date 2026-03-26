"use server";

import { FirestoreSavedSearchRepository } from "@/backend/crm/infrastructure/FirestoreSavedSearchRepository";

const repository = new FirestoreSavedSearchRepository();

export async function getLeadSavedSearchesAction(leadId: string) {
    try {
        const searches = await repository.findByLeadId(leadId);
        return { success: true, savedSearches: searches.map(s => s.toDTO()) };
    } catch (error) {
        console.error("Error fetching lead saved searches:", error);
        return { success: false, error: "Failed to fetch saved searches" };
    }
}
