import { FirestoreLegalDocumentRepository } from "@/backend/legal-docs/infrastructure/FirestoreLegalDocumentRepository";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import { FirestoreLeadRepository } from "@/backend/lead/infrastructure/FirestoreLeadRepository";
import { FirestoreTransactionPresetRepository } from "@/backend/legal-docs/infrastructure/FirestoreTransactionPresetRepository";
import { DocumentsDashboard } from "@/components/dashboard/DocumentsDashboard";

export default async function DocumentsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let documents: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let properties: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let leads: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let presets: any[] = [];

    try {
        const docRepo = new FirestoreLegalDocumentRepository();
        documents = await docRepo.findAll();
    } catch {
        // Collection might not exist
    }

    try {
        const propRepo = new FirestorePropertyRepository();
        properties = await propRepo.findAll();
    } catch {
        // Properties might not exist
    }

    try {
        const leadRepo = new FirestoreLeadRepository();
        leads = await leadRepo.findAll();
    } catch {
        // Leads might not exist
    }

    try {
        const presetRepo = new FirestoreTransactionPresetRepository();
        // Mock user id as is currently standard in the codebase for these fetching features
        presets = await presetRepo.findByUserId("user_1");
    } catch {
        // Presets might not exist
    }

    // Serialize dates for client component
    const serializedDocuments = documents.map(doc => {
        const p = doc.toPersistence();
        return {
            ...p,
            createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
            updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt
        };
    });

    const serializedProperties = properties.map(p => ({
        id: p.id,
        title: p.title,
        address: p.location.address || "No Address"
    }));

    const serializedLeads = leads.map(l => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        status: l.status
    }));

    const serializedPresets = presets.map(p => p.toPersistence());

    return (
        <div className="p-6 md:p-8 w-full">
            <DocumentsDashboard
                initialDocuments={serializedDocuments}
                properties={serializedProperties}
                leads={serializedLeads}
                presets={serializedPresets}
            />
        </div>
    );
}
