import { NextResponse } from "next/server";
import { FirestorePropertyRepository } from "@/backend/property/infrastructure/FirestorePropertyRepository";
import { Property, PropertyProps } from "@/backend/property/domain/Property";
import { PropertyDTO } from "@/types/property";

// Clean RESO compliant Mock Data
const MOCK_DATA: Partial<PropertyDTO>[] = [
    {
        UnparsedAddress: 'Modern Villa – Miami Shores',
        PublicRemarks: 'Stunning modern villa with pool and private dock.',
        ListPrice: 2500000,
        City: 'Miami',
        BedroomsTotal: 5,
        BathroomsTotalInteger: 4,
        LivingArea: 4500,
        Media: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        PropertyType: 'Residential',
        StandardStatus: 'Active',
    },
    {
        UnparsedAddress: 'Downtown Loft – Brickell',
        PublicRemarks: 'Industrial chic loft in the heart of Brickell. Walking distance to best restaurants and shops.',
        ListPrice: 850000,
        City: 'Miami',
        BedroomsTotal: 2,
        BathroomsTotalInteger: 2,
        LivingArea: 1400,
        Media: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
        PropertyType: 'Residential',
        StandardStatus: 'Active',
    }
];

export async function GET() {
    try {
        const repo = new FirestorePropertyRepository();
        let migratedCount = 0;

        for (const data of MOCK_DATA) {
            console.log(`Migrating property: ${data.UnparsedAddress}`);
            const property = Property.create(data as unknown as Omit<PropertyProps, 'createdAt' | 'updatedAt'> & { ListingKey?: string });
            await repo.save(property);
            migratedCount++;
        }

        console.log(`Migration completed. Count: ${migratedCount}`);

        return NextResponse.json({
            success: true,
            message: `Successfully migrated ${migratedCount} properties to Firestore with new UUIDs.`
        });
    } catch (error) {
        console.error("Migration failed FATAL:", error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}
