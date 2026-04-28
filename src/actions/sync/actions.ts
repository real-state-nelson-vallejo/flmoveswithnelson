"use server";

import { adminDb } from "@/lib/firebase/admin";

export interface SyncRunSummary {
    id: string;
    trigger: 'cron' | 'manual';
    source: string;
    status: 'running' | 'success' | 'error';
    startedAt: number;
    finishedAt: number | null;
    durationMs: number | null;
    deltaSynced: number | null;
    exclusiveSynced: number | null;
    total: number | null;
    error: string | null;
    agentId: string | null;
}

export async function getRecentSyncRunsAction(limit: number = 20): Promise<{ success: true; runs: SyncRunSummary[] } | { success: false; error: string }> {
    try {
        const snap = await adminDb
            .collection('syncRuns')
            .orderBy('startedAt', 'desc')
            .limit(limit)
            .get();

        const runs: SyncRunSummary[] = snap.docs.map(doc => {
            const data = doc.data();
            const startedAt = data.startedAt?.toMillis?.() ?? (data.startedAt instanceof Date ? data.startedAt.getTime() : Date.now());
            const finishedAt = data.finishedAt?.toMillis?.() ?? (data.finishedAt instanceof Date ? data.finishedAt.getTime() : null);

            return {
                id: doc.id,
                trigger: data.trigger ?? 'cron',
                source: data.source ?? 'unknown',
                status: data.status ?? 'running',
                startedAt,
                finishedAt,
                durationMs: data.durationMs ?? null,
                deltaSynced: data.deltaSynced ?? null,
                exclusiveSynced: data.exclusiveSynced ?? null,
                total: data.total ?? null,
                error: data.error ?? null,
                agentId: data.agentId ?? null,
            };
        });

        return { success: true, runs };
    } catch (error: any) {
        console.error('Failed to load sync runs:', error);
        return { success: false, error: error.message || 'Failed to load sync runs' };
    }
}
