import { getAvailableTemplates } from "@/app/actions/documents";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import DocumentWizard from "@/components/dashboard/DocumentWizard";

export default async function NewDocumentPage() {
    const templates = await getAvailableTemplates();
    const propertyRepo = new FirestorePropertyRepository();
    const properties = await propertyRepo.findAll();
    const propertyDTOs = properties.map(p => p.toDTO());

    return (
        <DocumentWizard
            templates={templates}
            properties={propertyDTOs}
        />
    );
}
