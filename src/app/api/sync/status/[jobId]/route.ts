import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
    try {
        await requireAdmin(req);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
    }

    const { jobId } = await params;
    const snap = await adminDb.collection("syncJobs").doc(jobId).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const data = snap.data()!;
    return NextResponse.json({
        id: snap.id,
        status: data.status,
        total: data.total ?? null,
        processed: data.processed ?? 0,
        added: data.added ?? 0,
        updated: data.updated ?? 0,
        priceDrops: data.priceDrops ?? 0,
        embedded: data.embedded ?? 0,
        embeddingsSkipped: data.embeddingsSkipped ?? 0,
        lastListingKey: data.lastListingKey ?? null,
        label: data.label ?? null,
        mode: data.mode,
        parentJobId: data.parentJobId ?? null,
        error: data.error ?? null,
        startedAt: data.startedAt?.toMillis?.() ?? null,
        finishedAt: data.finishedAt?.toMillis?.() ?? null,
    });
}
