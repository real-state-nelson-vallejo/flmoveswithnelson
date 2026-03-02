import { getAvailableTemplates } from "@/app/actions/documents";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import DocumentWizard from "@/components/dashboard/DocumentWizard";
import { PropertyDTO } from "@/backend/property/infrastructure/dto/PropertyDTO";

export default async function NewDocumentPage() {
    const templates = await getAvailableTemplates();
    // Fetch properties
    const propertyRepo = new FirestorePropertyRepository();
    const properties = await propertyRepo.findAll();
    const propertyDTOs: PropertyDTO[] = properties.map(p => p.toDTO());

    // Fetch leads
    const { FirestoreLeadRepository } = await import("@/backend/lead/infrastructure/FirestoreLeadRepository");
    const leadRepo = new FirestoreLeadRepository();
    const leadsEntities = await leadRepo.findAll();
    const leads = leadsEntities.map(l => ({
        id: l.id,
        name: l.name,
        email: l.email,
        phone: l.phone,
        status: l.status
    }));

    // Fetch presets for this user
    // In a real app, this comes from getServerSession() or auth context
    const mockUserId = "admin";
    const { FirestoreTransactionPresetRepository } = await import("@/backend/legal-docs/infrastructure/FirestoreTransactionPresetRepository");
    const presetRepo = new FirestoreTransactionPresetRepository();
    const presetEntities = await presetRepo.findByUserId(mockUserId);
    const presets = presetEntities.map(p => p.toPersistence());

    return (
        <DocumentWizard
            templates={templates}
            properties={propertyDTOs}
            leads={leads}
            presets={presets}
            userId={mockUserId}
        />
    );
}
