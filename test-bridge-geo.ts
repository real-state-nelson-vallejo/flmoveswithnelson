import { BridgeAPIClient } from './src/backend/property/infrastructure/BridgeAPIClient';
import { loadEnvConfig } from '@next/env';
import * as path from 'path';

loadEnvConfig(process.cwd());

async function testGeo() {
    const client = new BridgeAPIClient();
    const lat = 25.7617;
    const lng = -80.1918;
    
    // Test 1: Bounding Box
    const latDiff = 0.05;
    const lngDiff = 0.05;
    const filterBox = `Latitude ge ${lat - latDiff} and Latitude le ${lat + latDiff} and Longitude ge ${lng - lngDiff} and Longitude le ${lng + lngDiff}`;
    
    console.log("Testing filter:", filterBox);
    try {
        const resBox = await client.countProperties({ filter: filterBox });
        console.log("Box Count:", resBox);
    } catch(e: any) {
        console.error("Box error:", e.message);
    }
}

testGeo();
