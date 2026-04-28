import { NextResponse } from "next/server";
import { BridgePropertyRepository, AdvancedPropertyFilters } from "@/backend/property/infrastructure/BridgePropertyRepository";

export const dynamic = "force-dynamic";

const SPLIT_THRESHOLD = 800;

const MS_PER_PROP_QUALITY = 600;
const MS_PER_PROP_FAST = 150;

const PRICE_BUCKETS: Array<{ label: string; max: number | null }> = [
    { label: "< $300k", max: 300_000 },
    { label: "$300k – $600k", max: 600_000 },
    { label: "$600k – $1M", max: 1_000_000 },
    { label: "> $1M", max: null },
];

interface SubTotal {
    label: string;
    count: number;
    estimatedMsQuality: number;
    estimatedMsFast: number;
    filters: AdvancedPropertyFilters;
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const filters: AdvancedPropertyFilters = body?.filters ?? {};

        const bridgeRepo = new BridgePropertyRepository();
        const total = await bridgeRepo.countActiveProperties(filters);

        let subTotals: SubTotal[] | undefined;
        let splitStrategy: "counties" | "zones" | "price" | null = null;

        if (filters.counties && filters.counties.length > 1) {
            splitStrategy = "counties";
            subTotals = await Promise.all(
                filters.counties.map(async (county) => {
                    const subFilters: AdvancedPropertyFilters = { ...filters, counties: [county] };
                    const count = await bridgeRepo.countActiveProperties(subFilters);
                    return buildSubTotal(county, count, subFilters);
                })
            );
        } else if (filters.zones && filters.zones.length > 1) {
            splitStrategy = "zones";
            subTotals = await Promise.all(
                filters.zones.map(async (zone) => {
                    const subFilters: AdvancedPropertyFilters = { ...filters, zones: [zone] };
                    const count = await bridgeRepo.countActiveProperties(subFilters);
                    return buildSubTotal(zone, count, subFilters);
                })
            );
        } else if (total > SPLIT_THRESHOLD) {
            splitStrategy = "price";
            const runningMin: number | null = filters.maxPrice ?? null;
            subTotals = [];
            let prevMax: number | null = null;
            for (const bucket of PRICE_BUCKETS) {
                if (runningMin !== null && bucket.max !== null && bucket.max >= runningMin) break;
                const subFilters: AdvancedPropertyFilters = { ...filters };
                if (bucket.max !== null) {
                    subFilters.maxPrice = bucket.max;
                } else if (filters.maxPrice !== undefined) {
                    subFilters.maxPrice = filters.maxPrice;
                }
                const count = await countBucket(bridgeRepo, filters, prevMax, bucket.max);
                subTotals.push(buildSubTotal(bucket.label, count, subFilters));
                prevMax = bucket.max;
            }
            subTotals = subTotals.filter((s) => s.count > 0);
        }

        const estimatedMsQuality = total * MS_PER_PROP_QUALITY;
        const estimatedMsFast = total * MS_PER_PROP_FAST;
        const suggestSplit = total > SPLIT_THRESHOLD && !!subTotals && subTotals.length > 1;

        return NextResponse.json({
            total,
            estimatedMsQuality,
            estimatedMsFast,
            suggestSplit,
            splitStrategy,
            subTotals: subTotals ?? null,
            threshold: SPLIT_THRESHOLD,
        });
    } catch (error: any) {
        console.error("[sync/preview] error:", error);
        return NextResponse.json(
            { error: error.message || "Preview failed" },
            { status: 500 }
        );
    }
}

function buildSubTotal(label: string, count: number, filters: AdvancedPropertyFilters): SubTotal {
    return {
        label,
        count,
        estimatedMsQuality: count * MS_PER_PROP_QUALITY,
        estimatedMsFast: count * MS_PER_PROP_FAST,
        filters,
    };
}

/**
 * Bridge OData doesn't support BETWEEN directly in our filter builder; we approximate
 * by counting "<= max" and subtracting the previous bucket's cumulative count.
 */
async function countBucket(
    repo: BridgePropertyRepository,
    base: AdvancedPropertyFilters,
    prevMax: number | null,
    thisMax: number | null
): Promise<number> {
    const cumulative = thisMax === null
        ? await repo.countActiveProperties(base)
        : await repo.countActiveProperties({ ...base, maxPrice: thisMax });
    const previous = prevMax === null
        ? 0
        : await repo.countActiveProperties({ ...base, maxPrice: prevMax });
    return Math.max(0, cumulative - previous);
}
