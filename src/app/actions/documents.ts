'use server';

import { GenerateDocument } from "@/backend/legal-docs/application/GenerateDocument";
import { DocumentConfiguration } from "@/backend/legal-docs/infrastructure/DocumentConfiguration";
import { GeminiDocumentExtractor } from "@/backend/legal-docs/infrastructure/GeminiDocumentExtractor";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository"; // Or use dependency container
import { LegalDocument } from "@/backend/legal-docs/domain/LegalDocument";
import { LogicEngine } from "@/backend/legal-docs/domain/LogicEngine";

// Re-export types for client usage if needed
export type TemplateInfo = { id: string; name: string; description: string; };

export async function getAvailableTemplates(): Promise<TemplateInfo[]> {
    const templates = await DocumentConfiguration.getAllTemplates();
    return templates.map(t => ({ id: t.id, name: t.name, description: t.description }));
}

export async function getTemplateFieldsAction(templateId: string) {
    const template = await DocumentConfiguration.getTemplate(templateId);
    return template.fields;
}

import { FirestoreLegalProfileRepository } from "@/backend/legal-docs/infrastructure/FirestoreLegalProfileRepository";
import { FirestoreTransactionPresetRepository } from "@/backend/legal-docs/infrastructure/FirestoreTransactionPresetRepository";
import { FirestoreLeadRepository } from "@/backend/lead/infrastructure/FirestoreLeadRepository";
import { LegalProfile, LegalProfileProps } from "@/backend/legal-docs/domain/LegalProfile";
import { TransactionPreset } from "@/backend/legal-docs/domain/TransactionPreset";

// ... existing imports

export async function extractDocumentDataAction(
    propertyId: string,
    templateId: string,
    userContext: string,
    userId?: string,
    presetId?: string,
    leadId?: string, // Existing: Lead data (tenant/buyer)
    manualTenant?: { name: string, email: string, phone: string } // NEW: Manual tenant info if no lead selected
) {
    const propertyRepo = new FirestorePropertyRepository();
    const property = await propertyRepo.findById(propertyId);
    if (!property) throw new Error("Property not found");

    const template = await DocumentConfiguration.getTemplate(templateId);

    // Fetch Profile and Preset if userId is provided
    let profile = null;
    let preset = null;
    let lead = null;

    if (userId) {
        const profileRepo = new FirestoreLegalProfileRepository();
        profile = await profileRepo.findByUserId(userId);

        if (presetId) {
            const presetRepo = new FirestoreTransactionPresetRepository();
            preset = await presetRepo.findById(presetId);
        }
    }

    // Fetch lead (tenant/buyer) data for AI context - this is the key to high confidence tenant fields
    if (leadId) {
        const leadRepo = new FirestoreLeadRepository();
        lead = await leadRepo.findById(leadId);
    }

    const extractor = new GeminiDocumentExtractor();
    const aiData = await extractor.extractData(userContext, property, template, profile, preset, lead);

    // Apply Hard Logic Overrides (Rules > AI)
    const overrides = LogicEngine.evaluate(property, preset);

    return {
        data: { ...aiData.data, ...overrides },
        confidence: aiData.confidence // Keep confidence separate 
    };
}

// --- Profile Actions ---

export async function getLegalProfileAction(userId: string) {
    const repo = new FirestoreLegalProfileRepository();
    const profile = await repo.findByUserId(userId);
    if (!profile) return null;
    return profile.toPersistence();
}

export async function saveLegalProfileAction(userId: string, brokerData: LegalProfileProps['broker']) {
    const repo = new FirestoreLegalProfileRepository();
    let profile = await repo.findByUserId(userId);

    if (profile) {
        profile.updateBroker(brokerData);
    } else {
        profile = LegalProfile.create(userId, brokerData);
    }

    await repo.save(profile);
    return profile.toPersistence(); // Return plain object
}

// --- Preset Actions ---

export async function getTransactionPresetsAction(userId: string) {
    const repo = new FirestoreTransactionPresetRepository();
    const presets = await repo.findByUserId(userId);
    return presets.map(p => p.toPersistence());
}

export async function createTransactionPresetAction(userId: string, name: string, data: Record<string, any>, description?: string) {
    const repo = new FirestoreTransactionPresetRepository();
    const preset = TransactionPreset.create(userId, name, data, description);
    await repo.save(preset);
    return preset.toPersistence();
}

export async function deleteTransactionPresetAction(id: string) {
    const repo = new FirestoreTransactionPresetRepository();
    await repo.delete(id);
}

// ... existing generateDocumentAction


export async function generateDocumentAction(
    propertyId: string,
    templateId: string,
    data: Record<string, any>,
    userId?: string, // Added to trigger learning
    leadId?: string  // Added to bind the document to the CRM lead
) {
    const useCase = new GenerateDocument();

    const { document, pdfBuffer } = await useCase.execute({
        propertyId,
        templateId,
        existingData: data
    });

    if (leadId) {
        // We temporarily update the internal props directly.
        // A correct DDD approach would update `GenerateDocument` to take leadId.
        (document as any).props.leadId = leadId;
    }

    const filename = `legal_docs/${templateId}-${document.id}.pdf`;
    let downloadUrl = "";

    try {
        const { adminStorage } = await import("@/lib/firebase/admin");
        const bucket = adminStorage.bucket();
        const file = bucket.file(filename);

        await file.save(pdfBuffer, {
            metadata: { contentType: 'application/pdf' }
        });

        // Get a long-lived signed URL for downloading from the dashboard
        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // Far future for this MVP, real app should use dynamic signing
        });
        downloadUrl = url;
    } catch (error) {
        console.error("Failed to upload PDF to Firebase Storage", error);
        // Fallback or handle failure gracefully. The base64 is still returned below.
    }

    // Save metadata
    const { FirestoreLegalDocumentRepository } = await import("@/backend/legal-docs/infrastructure/FirestoreLegalDocumentRepository");
    const repo = new FirestoreLegalDocumentRepository();

    document.markAsGenerated(downloadUrl);
    await repo.save(document);

    // Trigger AI Learning if we have a userId
    if (userId) {
        try {
            const { SmartPresetLearner } = await import("@/backend/legal-docs/application/SmartPresetLearner");
            const { FirestoreTransactionPresetRepository } = await import("@/backend/legal-docs/infrastructure/FirestoreTransactionPresetRepository");
            const presetRepo = new FirestoreTransactionPresetRepository();
            const learner = new SmartPresetLearner(repo, presetRepo);

            // Fire and forget, don't block the response
            learner.learn(userId, templateId).catch(err => console.error("SmartPresetLearner background error:", err));
        } catch (error) {
            console.error("Failed to trigger SmartPresetLearner", error);
        }
    }

    return {
        filename: `${templateId}-${Date.now()}.pdf`,
        base64: pdfBuffer.toString('base64'),
        downloadUrl
    };
}

import { revalidatePath } from "next/cache";

export async function deleteDocumentAction(id: string) {
    const { FirestoreLegalDocumentRepository } = await import("@/backend/legal-docs/infrastructure/FirestoreLegalDocumentRepository");
    const repo = new FirestoreLegalDocumentRepository();
    await repo.delete(id);
    revalidatePath('/documents');
}
