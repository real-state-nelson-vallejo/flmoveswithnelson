import { NextResponse } from 'next/server';
import { SyncBridgeProperties } from '@/backend/property/application/SyncBridgeProperties';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized CRON Invocation', { status: 401 });
    }

    const runRef = adminDb.collection('syncRuns').doc();
    const startedAt = new Date();
    await runRef.set({
        trigger: 'cron',
        source: 'sync-mls',
        startedAt,
        status: 'running',
    });

    try {
        const NELSON_AGENT_ID = process.env.NEXT_PUBLIC_NELSON_AGENT_ID;
        if (!NELSON_AGENT_ID) {
            throw new Error('NEXT_PUBLIC_NELSON_AGENT_ID is not configured');
        }

        const syncUseCase = new SyncBridgeProperties();

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - 1);

        const resultDelta = await syncUseCase.syncDelta(sinceDate, 50);
        const resultExclusive = await syncUseCase.syncProperties({ agentId: NELSON_AGENT_ID }, 50, 0);

        const total = resultDelta.synced + resultExclusive.synced;

        await runRef.update({
            status: 'success',
            finishedAt: FieldValue.serverTimestamp(),
            durationMs: Date.now() - startedAt.getTime(),
            deltaSynced: resultDelta.synced,
            exclusiveSynced: resultExclusive.synced,
            total,
            sinceDate,
            agentId: NELSON_AGENT_ID,
        });

        return NextResponse.json({
            success: true,
            runId: runRef.id,
            message: `CRON sync successful. Ingested ${resultDelta.synced} Delta market properties and ${resultExclusive.synced} Exclusive Agent properties.`,
        });
    } catch (error: any) {
        console.error('CRON Delta Sync Failed FATAL:', error);

        await runRef.update({
            status: 'error',
            finishedAt: FieldValue.serverTimestamp(),
            durationMs: Date.now() - startedAt.getTime(),
            error: error.message || 'Pipeline Crash',
        }).catch(() => { /* swallow audit-write errors to not mask the original */ });

        return NextResponse.json({
            success: false,
            runId: runRef.id,
            error: error.message || 'Pipeline Crash',
        }, { status: 500 });
    }
}
