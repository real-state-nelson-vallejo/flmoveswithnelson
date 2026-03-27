import { NextResponse } from 'next/server';
import { SyncBridgeProperties } from '@/backend/property/application/SyncBridgeProperties';

/**
 * Serverless generic endpoint for automated CRON execution (e.g. Vercel Cron)
 * Ensure environment variable CRON_SECRET is defined to permit execution.
 */
export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    
    // Prevent unauthorized execution
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized CRON Invocation', { status: 401 });
    }

    try {
        const syncUseCase = new SyncBridgeProperties();
        
        // Execute Delta Sync for properties modified in the last 24 hours
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 1);

        const resultDelta = await syncUseCase.syncDelta(sinceDate, 50);

        // ALWAYS explicitly sync Nelson's exclusive active inventory alongside the general Delta
        const NELSON_AGENT_ID = "272509597";
        const resultExclusive = await syncUseCase.syncProperties({ agentId: NELSON_AGENT_ID }, 50, 0);

        return NextResponse.json({ 
            success: true, 
            message: `CRON sync successful. Ingested ${resultDelta.synced} Delta market properties and ${resultExclusive.synced} Exclusive Agent properties.`
        });
    } catch (error: any) {
        console.error('CRON Delta Sync Failed FATAL:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Pipeline Crash' 
        }, { status: 500 });
    }
}
