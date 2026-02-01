'use server';

import { crmDependencies } from "@/backend/crm/dependencies";
import { CRMConfig } from "@/backend/crm/domain/CRMConfig";
import { revalidatePath } from "next/cache";

export async function getCRMConfigAction(id: string = 'default') {
    try {
        const config = await crmDependencies.getConfig.execute(id);
        return { success: true, data: config };
    } catch (error) {
        console.error("Error fetching CRM config:", error);
        return { success: false, error: "Failed to fetch CRM configuration" };
    }
}

export async function saveCRMConfigAction(config: CRMConfig) {
    try {
        await crmDependencies.saveConfig.execute(config);
        revalidatePath('/dashboard/crm');
        return { success: true };
    } catch (error) {
        console.error("Error saving CRM config:", error);
        return { success: false, error: "Failed to save CRM configuration" };
    }
}
