import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { DocumentGenerator } from "../domain/DocumentGenerator";
import { LegalDocument } from "../domain/LegalDocument";
import { DocumentTemplate } from "../domain/DocumentTemplate";

export class PdfLibDocumentGenerator implements DocumentGenerator {
    async generate(document: LegalDocument, template: DocumentTemplate): Promise<Buffer> {
        let pdfBytes: Buffer;

        if (template.pdfPath.startsWith('http')) {
            const response = await fetch(template.pdfPath);
            if (!response.ok) {
                throw new Error(`Failed to fetch PDF from remote source: ${response.statusText}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            pdfBytes = Buffer.from(arrayBuffer);
        } else {
            // Fallback for local testing if path is still local
            const pdfPath = path.resolve(process.cwd(), template.pdfPath);
            pdfBytes = fs.readFileSync(pdfPath);
        }

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const pages = pdfDoc.getPages();
        if (pages.length === 0) {
            throw new Error(`PDF has no pages: ${template.pdfPath}`);
        }

        // Use first page height as reference if needed, though we use each page's size in the loop
        // const { height } = pages[0].getSize(); 

        const data = document.data;

        for (const field of template.fields) {
            const value = data[field.fieldId];
            if (value === undefined || value === null) continue;

            // My new maps are 0-indexed (Doc AI). Old code expected 1-indexed.
            const pageIndex = field.page;
            if (pageIndex < 0 || pageIndex >= pages.length) continue;

            const page = pages[pageIndex];
            if (!page) continue; // Safety check

            const pageSize = page.getSize();

            // Defaults
            const rectH = field.rect.height || 12;
            const rectW = field.rect.width || 100;

            // Coordinate System:
            // field.rect.y is distance from TOP of page (from Doc AI).
            // pdf-lib Y=0 is BOTTOM of page.
            // effectiveY = pageSize.height - field.rect.y - field.rect.height + 2 (padding)

            const fontSize = field.style?.fontSize || 10;
            const pdfY = pageSize.height - field.rect.y - rectH + 2;

            if (['text', 'date', 'money'].includes(field.type) || !field.type) {
                // Formatting values if needed?
                // For now, assume Gemini/User provided formatted strings.
                page.drawText(String(value), {
                    x: field.rect.x + 2, // Slight padding X
                    y: pdfY,
                    size: fontSize,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            } else if (field.type === 'checkbox' && value === true) {
                // Center the X
                page.drawText('X', {
                    x: field.rect.x + (rectW / 2) - 4,
                    y: pdfY,
                    size: 12,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }
        }

        const uint8Array = await pdfDoc.save();
        return Buffer.from(uint8Array);
    }
}
