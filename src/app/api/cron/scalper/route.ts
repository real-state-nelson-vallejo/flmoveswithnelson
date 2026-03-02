import { NextResponse } from "next/server";
import { ScanMarketOpportunities } from "@/backend/market/application/ScanMarketOpportunities";
import { marketDependencies } from "@/backend/market/dependencies";

// Prevent Vercel from caching this route
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const zips = searchParams.get('zips')?.split(',') || ['33139', '33130']; // Default Miami Zips

        const scanner = new ScanMarketOpportunities(
            marketDependencies.marketDataService,
            marketDependencies.opportunityRepository
        );

        const opportunities = await scanner.execute(zips);

        return NextResponse.json({
            success: true,
            scannedZips: zips,
            opportunitiesFound: opportunities.length,
            opportunities: opportunities
        });

    } catch (error) {
        console.error("Scalper Error:", error);
        return NextResponse.json(
            { success: false, error: "Failed to run market scalper" },
            { status: 500 }
        );
    }
}
