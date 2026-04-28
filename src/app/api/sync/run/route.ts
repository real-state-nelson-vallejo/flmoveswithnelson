import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { FieldValue } from "firebase-admin/firestore";
import type { AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

export const dynamic = "force-dynamic";

interface RunBody {
    filters: AdvancedPropertyFilters;
    mode: "quality" | "fast";
    total?: number;
    split?: Array<{ label: string; count: number; filters: AdvancedPropertyFilters }>;
    limitCap?: number;
    label?: string;
}

const MIN_FILTER_KEYS: Array<keyof AdvancedPropertyFilters> = [
    "zones", "counties", "agentId", "officeId", "spatialBox",
];

function hasUsefulFilter(filters: AdvancedPropertyFilters): boolean {
    return MIN_FILTER_KEYS.some((key) => {
        const v = filters[key];
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== "";
    });
}

export async function POST(req: Request) {
    let admin;
    try {
        admin = await requireAdmin(req);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
    }

    let body: RunBody;
    try {
        body = (await req.json()) as RunBody;
    } catch {
        return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    if (!body?.filters || !body.mode) {
        return NextResponse.json({ error: "Missing filters or mode" }, { status: 400 });
    }
    if (body.mode !== "quality" && body.mode !== "fast") {
        return NextResponse.json({ error: "mode must be 'quality' or 'fast'" }, { status: 400 });
    }
    if (!hasUsefulFilter(body.filters)) {
        return NextResponse.json(
            { error: "Refusing to run with empty/wildcard filters. Specify zones, counties, agentId, officeId or spatialBox." },
            { status: 400 }
        );
    }

    const batchSize = 50;
    const baseJob = {
        mode: body.mode,
        batchSize,
        processed: 0,
        added: 0,
        updated: 0,
        skipped: 0,
        priceDrops: 0,
        embedded: 0,
        embeddingsSkipped: 0,
        lastListingKey: null,
        cursor: { skip: 0 },
        status: "pending" as const,
        startedAt: FieldValue.serverTimestamp(),
        finishedAt: null as null | FirebaseFirestore.FieldValue,
        createdBy: admin.uid,
        createdByEmail: admin.email,
        limitCap: body.limitCap ?? null,
    };

    const col = adminDb.collection("syncJobs");
    const jobIds: string[] = [];

    if (body.split && body.split.length > 0) {
        const parentRef = col.doc();
        const parentId = parentRef.id;
        const batch = adminDb.batch();
        body.split.forEach((part, index) => {
            const childRef = col.doc();
            jobIds.push(childRef.id);
            batch.set(childRef, {
                ...baseJob,
                filters: part.filters,
                total: part.count,
                label: part.label,
                parentJobId: parentId,
                order: index,
                status: index === 0 ? "pending" : "queued",
            });
        });
        batch.set(parentRef, {
            ...baseJob,
            filters: body.filters,
            total: body.split.reduce((acc, p) => acc + p.count, 0),
            label: body.label ?? `Split ${body.split.length} jobs`,
            isParent: true,
            childJobIds: jobIds,
            status: "pending",
        });
        await batch.commit();
        return NextResponse.json({ jobIds, lead: jobIds[0], parentJobId: parentId });
    }

    const ref = col.doc();
    jobIds.push(ref.id);
    await ref.set({
        ...baseJob,
        filters: body.filters,
        total: body.total ?? null,
        label: body.label ?? formatJobLabel(body.filters),
    });

    return NextResponse.json({ jobIds, lead: ref.id });
}

function formatJobLabel(filters: AdvancedPropertyFilters): string {
    if (filters.zones?.length) return `Zones: ${filters.zones.join(", ")}`;
    if (filters.counties?.length) return `Counties: ${filters.counties.join(", ")}`;
    if (filters.agentId) return `Agent ${filters.agentId}`;
    if (filters.officeId) return `Office ${filters.officeId}`;
    if (filters.spatialBox) return `Map area`;
    return "Sync";
}
