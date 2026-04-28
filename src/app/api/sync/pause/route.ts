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
    if (data.status === "done" || data.status === "error") {
        return NextResponse.json({ error: `Cannot pause job in status '${data.status}'` }, { status: 409 });
    }

    await jobRef.update({
        status: "paused",
        pausedAt: FieldValue.serverTimestamp(),
        pausedBy: admin.uid,
    });

    await adminDb.collection("notifications").add({
        uid: admin.uid,
        type: "sync-paused",
        title: "Sincronización pausada",
        body: `Se guardó progreso en ${data.processed ?? 0} de ${data.total ?? "?"}. Podés reanudar cuando quieras.`,
        jobId,
        read: false,
        createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
}
