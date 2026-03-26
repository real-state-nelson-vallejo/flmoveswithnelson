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

        const result = await syncUseCase.syncDelta(sinceDate, 50);

        return NextResponse.json({ 
            success: true, 
            message: `Delta CRON sync successful. Ingested ${result.synced} modified RESO properties.`
        });
    } catch (error: any) {
        console.error('CRON Delta Sync Failed FATAL:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message || 'Pipeline Crash' 
        }, { status: 500 });
    }
}
