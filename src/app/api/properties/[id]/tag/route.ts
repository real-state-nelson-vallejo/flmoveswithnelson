import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { HomeSectionSchema } from "@/lib/schemas/propertySchema";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PatchBodySchema = z.object({
    homeSections: z.array(HomeSectionSchema).optional(),
    editorialNotes: z.string().max(500).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    let admin;
    try {
        admin = await requireAdmin(req);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
    }

    const { id } = await params;

    let rawBody: unknown;
    try {
        rawBody = await req.json();
    } catch {
        return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const parsed = PatchBodySchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid body", details: parsed.error.format() }, { status: 400 });
    }

    const propRef = adminDb.collection("properties").doc(id);
    const snap = await propRef.get();
    if (!snap.exists) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {
        curatedAt: FieldValue.serverTimestamp(),
        curatedBy: admin.uid,
        updatedAt: Date.now(),
    };
    if (parsed.data.homeSections !== undefined) update.homeSections = parsed.data.homeSections;
    if (parsed.data.editorialNotes !== undefined) update.editorialNotes = parsed.data.editorialNotes;

    await propRef.update(update);

    // Flush the cached home-featured feed so the change is visible on the public
    // home immediately instead of waiting for the 60s TTL. revalidatePath is a
    // no-op during dev with unstable_cache, but works in prod ISR.
    revalidateTag('home-featured');
    revalidateTag('home-sections');
    revalidateTag('property-stats');
    try {
        revalidatePath(`/en/properties/${id}`);
        revalidatePath(`/es/properties/${id}`);
        revalidatePath(`/en`);
        revalidatePath(`/es`);
    } catch {
        // Paths might not be cached yet; that's fine.
    }

    return NextResponse.json({ ok: true, id });
}
