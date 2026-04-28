import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export const dynamic = "force-dynamic";

/**
 * On-demand revalidation endpoint.
 * Called by:
 *  - Firebase Functions worker after a sync job completes (flush public listings).
 *  - Any admin action that changes data visible on cached public pages.
 *
 * Auth: shared secret in `REVALIDATE_SECRET` (HMAC is overkill for cache flushes).
 */
export async function POST(req: Request) {
    let body: { secret?: string; paths?: string[]; tags?: string[] };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const expected = process.env.REVALIDATE_SECRET;
    if (!expected) {
        return NextResponse.json({ error: "Server missing REVALIDATE_SECRET" }, { status: 500 });
    }
    if (body.secret !== expected) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paths: string[] = Array.isArray(body.paths) ? body.paths : [];
    const tags: string[] = Array.isArray(body.tags) ? body.tags : [];

    for (const path of paths) {
        if (typeof path === "string" && path.startsWith("/")) {
            revalidatePath(path);
        }
    }
    for (const tag of tags) {
        if (typeof tag === "string" && tag.length > 0) {
            revalidateTag(tag);
        }
    }

    return NextResponse.json({ revalidated: { paths, tags } });
}
