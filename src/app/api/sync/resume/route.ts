import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/server";
import { FieldValue } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    let admin;
    try {
        admin = await requireAdmin(req);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: err.status ?? 500 });
    }

    let body: { jobId?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
    }

    const { jobId } = body;
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    const jobRef = adminDb.collection("syncJobs").doc(jobId);
    const snap = await jobRef.get();
    if (!snap.exists) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const data = snap.data()!;
    if (data.status !== "paused") {
        return NextResponse.json({ error: `Cannot resume job in status '${data.status}'` }, { status: 409 });
    }

    await jobRef.update({
        status: "pending",
        resumedAt: FieldValue.serverTimestamp(),
        resumedBy: admin.uid,
    });

    return NextResponse.json({ ok: true });
}
