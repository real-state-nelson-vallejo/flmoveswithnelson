import { config } from 'dotenv';
import { BridgePropertyRepository } from './src/backend/property/infrastructure/BridgePropertyRepository';

// Load environmental variables properly for standard TSX script
config({ path: '.env.local' });
config({ path: '.env' });

async function runTests() {
    console.log("=== BRIDGE ODATA API - CASUíSTICAS DE FILTER ===");
    const repo = new BridgePropertyRepository();

    const scenarios = [
        {
            name: "1. Filtro Simple (Property Type, Max Price)",
            filters: { propertyType: "Residential", maxPrice: 700000 },
            limit: 3
        },
        {
            name: "2. Fronteras Numéricas (Min Beds, Min Baths)",
            filters: { minBeds: 4, minBaths: 3, maxPrice: 1500000 },
            limit: 3
        },
        {
            name: "3. Atributos Físicos (Min SqFt, Pool, Waterfront)",
            filters: { minSqFt: 2500, hasPool: true, waterfront: true },
            limit: 3
        },
        {
            name: "4. Zonas Manuales Array (Zip + City)",
            filters: { zones: ["33132", "Miami"] },
            limit: 3
        },
        {
            name: "5. Bounding Box Espacial (Polygon Array) + Tipo Propiedad",
            filters: { 
                propertyType: "Residential",
                // A roughly random box inside Miami region
                spatialBox: { latMin: 25.70, latMax: 25.85, lngMin: -80.40, lngMax: -80.15 }
            },
            limit: 3
        },
        {
            name: "6. COMBINACIÓN MASIVA AI (Box + Pool + Beds + Price)",
            filters: {
                propertyType: "Residential",
                spatialBox: { latMin: 25.70, latMax: 25.85, lngMin: -80.40, lngMax: -80.15 },
                maxPrice: 2000000,
                minBeds: 3,
                hasPool: true
            },
            limit: 3
        }
    ];

    let totalPassed = 0;

    for (const scenario of scenarios) {
        console.log(`\n---------------------------------------------------------`);
        console.log(`[TEST]: ${scenario.name}`);
        try {
            const properties = await repo.getActiveProperties(scenario.filters as any, scenario.limit, 0);
            console.log(`✅ EXITO! OData generó respuesta HTTP 200.`);
            console.log(`✅ Resultados encontrados: ${properties.length}`);
            
            if (properties.length > 0) {
                const sample = properties[0] as any;
                console.log(`[EJEMPLO]: Propiedad importada correctamente. ID Externo: ${sample.externalId}`);
            }
            totalPassed++;
        } catch (err: any) {
            console.error(`❌ FALLO EL TEST: ${err.message}`);
        }
    }

    console.log(`\n=========================================================`);
    console.log(`Tests Finalizados. ${totalPassed}/${scenarios.length} exitosos.`);
    console.log(`=========================================================\n`);
}

runTests().catch(console.error);
