"use server";

import { FirestoreDocumentTemplateRepository } from "@/backend/legal-docs/infrastructure/FirestoreDocumentTemplateRepository";

export async function getTemplateOptionsAction() {
    const repo = new FirestoreDocumentTemplateRepository();
    const templates = await repo.findAll();
    return templates.map(t => ({ id: t.id, title: t.name }));
}

export async function getMapDetailsAction(templateId: string) {
    const repo = new FirestoreDocumentTemplateRepository();
    const template = await repo.findById(templateId);

    if (!template) throw new Error("Template not found");

    return {
        pdfPath: template.pdfPath,
        fields: template.fields || []
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveMapDetailsAction(templateId: string, fields: any[]) {
    const repo = new FirestoreDocumentTemplateRepository();
    const template = await repo.findById(templateId);

    if (!template) throw new Error("Template not found");

    template.fields = fields;
    await repo.save(template);

    return { success: true };
}
