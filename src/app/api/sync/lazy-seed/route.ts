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
        
        // Single text input (legacy)
        let zone = searchCriteria.zone || searchCriteria.query;
        if (zone && typeof zone === 'string') {
            zone = zone.replace(/\+/g, ' ');
            filters.zone = zone;
        }

        // Advanced Filters Mapping
        if (Array.isArray(searchCriteria.zones)) filters.zones = searchCriteria.zones;
        if (Array.isArray(searchCriteria.counties)) filters.counties = searchCriteria.counties;
        if (Array.isArray(searchCriteria.propertySubTypes)) filters.propertySubTypes = searchCriteria.propertySubTypes;
        
        if (searchCriteria.minBeds) filters.minBeds = Number(searchCriteria.minBeds);
        if (searchCriteria.maxPrice) filters.maxPrice = Number(searchCriteria.maxPrice);
        if (searchCriteria.type) filters.propertyType = searchCriteria.type;
        
        // Structural & Lifestyle
        if (searchCriteria.minBaths) filters.minBaths = Number(searchCriteria.minBaths);
        if (searchCriteria.minSqFt) filters.minSqFt = Number(searchCriteria.minSqFt);
        if (searchCriteria.waterfront) filters.waterfront = true;
        if (searchCriteria.hasPool) filters.hasPool = true;
        
        // Spatial Map Search - Bridge uses OData Lat/Lng bounding box (near param is not supported)
        if (searchCriteria.spatialBox) {
            filters.spatialBox = {
                latMin: Number(searchCriteria.spatialBox.latMin),
                latMax: Number(searchCriteria.spatialBox.latMax),
                lngMin: Number(searchCriteria.spatialBox.lngMin),
                lngMax: Number(searchCriteria.spatialBox.lngMax),
            };
        } else if (searchCriteria.spatial?.lat && searchCriteria.spatial?.lng && searchCriteria.spatial?.radius) {
            // Legacy: convert circle to bounding box
            const lat = Number(searchCriteria.spatial.lat);
            const lng = Number(searchCriteria.spatial.lng);
            const milesInDeg = Number(searchCriteria.spatial.radius) / 69;
            filters.spatialBox = {
                latMin: lat - milesInDeg,
                latMax: lat + milesInDeg,
                lngMin: lng - milesInDeg * 1.2,
                lngMax: lng + milesInDeg * 1.2,
            };
        }

        // Perform the Organic Lazy Seeding (Top 20)
        await syncUseCase.syncProperties(filters, 20);

        return NextResponse.json({ success: true, message: 'Organic seed initiated' });

    } catch (error: any) {
        console.error("Lazy Seed API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
