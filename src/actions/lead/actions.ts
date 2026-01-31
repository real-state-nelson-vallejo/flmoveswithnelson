"use server";

import { CaptureLead } from "@/backend/lead/application/CaptureLead";
import { leadDependencies } from "@/backend/lead/dependencies";

export async function captureLeadAction(data: { name: string; email: string; phone?: string; propertyId?: string }) {
    const useCase = new CaptureLead(leadDependencies.leadRepository);
    return await useCase.execute(data);
}
