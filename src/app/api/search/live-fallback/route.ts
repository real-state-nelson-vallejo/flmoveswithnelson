import { NextResponse } from 'next/server';
import { BridgePropertyRepository } from '@/backend/property/infrastructure/BridgePropertyRepository';

// In a real production setup, we would add IP Rate Limiting (e.g. upstash/redis) here 
// to prevent bots from spamming this endpoint.

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        
        let zone = searchParams.get('zone') || undefined;
        const q = searchParams.get('q');
        if (q && !zone) {
            zone = q.replace(/\+/g, ' ');
        }

        // Apply strict geofencing to prevent API waste on irrelevant queries
        if (zone) {
            const blockedKeywords = ['new york', 'california', 'texas', 'london', 'paris'];
            if (blockedKeywords.some(bk => zone!.toLowerCase().includes(bk))) {
                return NextResponse.json({ count: 0, reason: 'geofenced' });
            }
        }

        const minBeds = searchParams.get('minBeds') ? Number(searchParams.get('minBeds')) : undefined;
        const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
        const propertyType = searchParams.get('type') || undefined;

        const repo = new BridgePropertyRepository();
        
        const filterArgs: any = {};
        if (zone) filterArgs.zone = zone;
        if (minBeds) filterArgs.minBeds = minBeds;
        if (maxPrice) filterArgs.maxPrice = maxPrice;
        if (propertyType) filterArgs.propertyType = propertyType;
        
        // This executes a `$count=true` request. Barely uses any API bandwidth.
        const count = await repo.countActiveProperties(filterArgs);

        // We can optionally write this 'count' to a Firestore cache (e.g. market_teasers) here
        // to bypass the Bridge API entirely on identical checks. For now, it's just live.

        return NextResponse.json({ 
            success: true, 
            count 
        });

    } catch (error: any) {
        console.error("Live Fallback API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
