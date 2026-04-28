import {defineSecret} from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {SyncJobDoc} from "./types.js";

export const ADMIN_NOTIFICATION_EMAIL = defineSecret("ADMIN_NOTIFICATION_EMAIL");
export const REVALIDATE_SECRET = defineSecret("REVALIDATE_SECRET");
export const NEXT_PUBLIC_URL = defineSecret("NEXT_PUBLIC_URL");

/**
 * Pings the Next.js app to flush ISR / unstable_cache for public pages after data changes.
 * No-ops if either secret is missing (dev / first deploy).
 */
export async function triggerRevalidation(paths: string[], tags: string[]): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!baseUrl || !secret) {
    logger.info("[revalidate] skipped — missing NEXT_PUBLIC_URL or REVALIDATE_SECRET");
    return;
  }
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({secret, paths, tags}),
    });
    if (!res.ok) {
      logger.warn(`[revalidate] Next responded ${res.status}`);
    }
  } catch (err: any) {
    logger.warn(`[revalidate] failed: ${err.message}`);
  }
}

const NOTIFY_MIN_DURATION_MS = 5 * 60 * 1000;

export async function notifyJobCompleted(
  db: admin.firestore.Firestore,
  jobId: string,
  job: SyncJobDoc,
  durationMs: number,
): Promise<void> {
  const shouldEmail = durationMs >= NOTIFY_MIN_DURATION_MS;
  const label = job.label || "Sync";
  const summary = `${job.processed}/${job.total ?? "?"} procesadas · +${job.added} nuevas · ${job.updated} actualizadas · ${job.priceDrops} price-drops`;

  if (job.createdBy) {
    await db.collection("notifications").add({
      uid: job.createdBy,
      type: "sync-completed",
      title: `Sync completado: ${label}`,
      body: summary,
      jobId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (shouldEmail) {
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!to) {
      console.warn("[notify] ADMIN_NOTIFICATION_EMAIL missing, skipping email");
    } else {
      await db.collection("mail").add({
        to,
        message: {
          subject: `Sync completado: ${label} · ${job.total ?? job.processed} propiedades`,
          html: `
            <p>La sincronización <strong>${label}</strong> finalizó correctamente.</p>
            <ul>
              <li><strong>Propiedades procesadas:</strong> ${job.processed} de ${job.total ?? "?"}</li>
              <li><strong>Nuevas:</strong> ${job.added}</li>
              <li><strong>Actualizadas:</strong> ${job.updated}</li>
              <li><strong>Price drops detectados:</strong> ${job.priceDrops}</li>
              <li><strong>Embeddings generados:</strong> ${job.embedded} (saltados: ${job.embeddingsSkipped})</li>
              <li><strong>Duración total:</strong> ${Math.round(durationMs / 1000)}s</li>
            </ul>
          `,
        },
      });
    }
  }

  // Flush ISR caches so the public home + /properties pages show the new inventory.
  await triggerRevalidation(
    ["/en", "/es", "/en/properties", "/es/properties"],
    ["home-featured", "home-sections", "property-stats"],
  );
}

export async function notifyJobError(
  db: admin.firestore.Firestore,
  jobId: string,
  job: SyncJobDoc,
  errorMsg: string,
): Promise<void> {
  if (!job.createdBy) return;
  await db.collection("notifications").add({
    uid: job.createdBy,
    type: "sync-error",
    title: `Sync con error: ${job.label || "Sync"}`,
    body: errorMsg,
    jobId,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}
