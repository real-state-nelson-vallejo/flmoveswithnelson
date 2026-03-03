"use server";

import { PDFDocument } from "pdf-lib";
import { FieldMapping } from "@/backend/legal-docs/domain/DocumentTemplate";

interface UploadPDFTemplateResponse {
    success: boolean;
    templateId?: string;
    error?: string;
}

export async function uploadPDFTemplateAction(
    formData: FormData
): Promise<UploadPDFTemplateResponse> {
    try {
        const file = formData.get("file") as File;
        const templateName = formData.get("templateName") as string;

        if (!file || !templateName) {
            return { success: false, error: "Missing file or template name." };
        }

        // 1. Generate a Safe ID
        const templateId = templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // 2. Load PDF into Memory for Parsing & Storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Extract AcroForm Fields using pdf-lib
        const pdfDoc = await PDFDocument.load(buffer);
        const form = pdfDoc.getForm();
        const rawFields = form.getFields();

        const extractedFields: FieldMapping[] = [];

        // For each field, we extract its name to bootstrap the FieldMapping
        for (const field of rawFields) {
            const fieldName = field.getName();

            // Note: Determining the bounding box automatically requires widget parsing,
            // which can be complex depending on the PDF. 
            // For now, we seed the field name to enable the user to map it visually later.
            extractedFields.push({
                fieldId: fieldName,
                originalLabel: fieldName,
                type: 'text', // default assumption
                page: 1,      // default assumption
                rect: { x: 0, y: 0, width: 100, height: 20 } // Needs manual mapping later (or Phase 9 AI)
            });
        }

        const { adminDb, adminStorage } = await import("@/lib/firebase/admin");

        // 4. Upload raw PDF to Firebase Storage
        const bucket = adminStorage.bucket();
        const storagePath = `legal-docs/templates/${templateId}.pdf`;
        const fileRef = bucket.file(storagePath);

        await fileRef.save(buffer, {
            metadata: { contentType: "application/pdf" }
        });

        const [pdfUrl] = await fileRef.getSignedUrl({
            action: 'read',
            expires: '01-01-2500' // Far future for static templates
        });

        // 5. Save the DocumentTemplate to Firestore
        const templateData = {
            id: templateId,
            name: templateName,
            description: `Auto-extracted (${extractedFields.length} fields)`,
            pdfPath: pdfUrl,
            fields: extractedFields,
            updatedAt: new Date().toISOString()
        };

        await adminDb.collection("document_templates").doc(templateId).set(templateData);

        return { success: true, templateId };
    } catch (error) {
        console.error("Failed to upload PDF template:", error);
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}
