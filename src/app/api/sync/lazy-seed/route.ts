import { NextResponse } from 'next/server';
import { SyncBridgeProperties } from '@/backend/property/application/SyncBridgeProperties';
import { BridgePropertyRepository } from '@/backend/property/infrastructure/BridgePropertyRepository';
import { FirestorePropertyRepository } from '@/backend/property/infrastructure/FirestorePropertyRepository';
import { VectorizePropertyService } from '@/backend/property/application/VectorizePropertyService';

export async function POST(req: Request) {
    try {
        let body;
        try {
            const rawBody = await req.text();
            if (!rawBody) {
                return NextResponse.json({ success: false, error: 'Empty request body' }, { status: 400 });
            }
            body = JSON.parse(rawBody);
        } catch (e) {
            return NextResponse.json({ success: false, error: 'Malformed JSON payload' }, { status: 400 });
        }

        const { searchCriteria } = body;

        if (!searchCriteria) {
            return NextResponse.json({ success: false, error: 'criteria required' }, { status: 400 });
        }

        // Initialize Use Case dependencies
        const bridgeRepo = new BridgePropertyRepository();
        const firestoreRepo = new FirestorePropertyRepository();
        const vectorService = new VectorizePropertyService();
        
        const syncUseCase = new SyncBridgeProperties(bridgeRepo, firestoreRepo, vectorService);

        // Map UI criteria to backend filters
        const filters: any = {};
        let zone = searchCriteria.zone || searchCriteria.query;
        if (zone) {
            zone = zone.replace(/\+/g, ' ');
            filters.zone = zone;
        }

        if (searchCriteria.minBeds) filters.minBeds = Number(searchCriteria.minBeds);
        if (searchCriteria.maxPrice) filters.maxPrice = Number(searchCriteria.maxPrice);
        if (searchCriteria.type) filters.propertyType = searchCriteria.type;

        // Perform the Organic Lazy Seeding (Top 20)
        await syncUseCase.syncProperties(filters, 20);

        return NextResponse.json({ success: true, message: 'Organic seed initiated' });

    } catch (error: any) {
        console.error("Lazy Seed API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
