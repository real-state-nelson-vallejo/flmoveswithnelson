import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {fetchBridgeBatch, countBridge} from "./bridge.js";
import {persistBridgeProperty} from "./firestoreSync.js";
import {embedAndStore} from "./embeddings.js";
import {notifyJobCompleted, notifyJobError} from "./notify.js";
import {SyncJobDoc, SyncJobStatus} from "./types.js";

const COLLECTION = "syncJobs";
const INTER_BATCH_DELAY_MS = 350;

// Firestore triggers cap at 540s. We stop iterating well before that and
// re-queue the job via a status flip, which re-fires onSyncJobUpdated.
const RUNTIME_BUDGET_MS = 480_000; // 8 min — leaves ~60s slack for finalization.

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function readJob(db: admin.firestore.Firestore, jobId: string): Promise<SyncJobDoc | null> {
  const snap = await db.collection(COLLECTION).doc(jobId).get();
  if (!snap.exists) return null;
  return snap.data() as SyncJobDoc;
}

async function updateJob(
  db: admin.firestore.Firestore,
  jobId: string,
  partial: Partial<SyncJobDoc> & Record<string, any>,
): Promise<void> {
  await db.collection(COLLECTION).doc(jobId).update(partial);
}

/**
 * Atomically transitions the job from 'pending' to 'processing' so that
 * concurrent trigger invocations don't double-process.
 */
async function claimJob(db: admin.firestore.Firestore, jobId: string): Promise<SyncJobDoc | null> {
  const ref = db.collection(COLLECTION).doc(jobId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const data = snap.data() as SyncJobDoc;
    if (data.status !== "pending") return null;
    tx.update(ref, {status: "processing" as SyncJobStatus});
    return {...data, status: "processing" as SyncJobStatus};
  });
}

async function maybeStartNextSibling(db: admin.firestore.Firestore, parentJobId: string): Promise<void> {
  const next = await db.collection(COLLECTION)
    .where("parentJobId", "==", parentJobId)
    .where("status", "==", "queued")
    .orderBy("order", "asc")
    .limit(1)
    .get();
  if (next.empty || !next.docs[0]) return;
  await next.docs[0].ref.update({status: "pending" as SyncJobStatus});
}

export async function processJob(jobId: string): Promise<void> {
  const db = admin.firestore();

  const job = await claimJob(db, jobId);
  if (!job) {
    logger.info(`[processJob] ${jobId} not claimable (already processed/paused/missing).`);
    return;
  }

  // Resolve total lazily if not set yet (first run of this job).
  if (job.total === null || job.total === undefined) {
    try {
      const total = await countBridge(job.filters);
      const capped = job.limitCap ? Math.min(total, job.limitCap) : total;
      await updateJob(db, jobId, {total: capped});
      job.total = capped;
    } catch (err: any) {
      const msg = `countBridge failed: ${err.message}`;
      logger.error(`[processJob] ${jobId} ${msg}`);
      await updateJob(db, jobId, {
        status: "error" as SyncJobStatus,
        error: msg,
        finishedAt: admin.firestore.FieldValue.serverTimestamp() as any,
      });
      await notifyJobError(db, jobId, job, msg);
      return;
    }
  }

  const startedAtMs = Date.now();
  const batchSize = job.batchSize || 50;
  const skipEmbeddingIfUnchanged = job.mode === "fast";

  let cursorSkip = job.cursor?.skip ?? 0;
  const total = job.total ?? 0;

  try {
    while (cursorSkip < total) {
      // Budget watchdog: leave the loop before the runtime timeout fires.
      if (Date.now() - startedAtMs > RUNTIME_BUDGET_MS) {
        logger.info(`[processJob] ${jobId} budget hit at skip=${cursorSkip}; re-queueing.`);
        await updateJob(db, jobId, {
          status: "pending" as SyncJobStatus,
          cursor: {skip: cursorSkip},
        });
        return;
      }

      // Pause detection: caller may have flipped status to 'paused'.
      const live = await readJob(db, jobId);
      if (!live) throw new Error("Job disappeared mid-run");
      if (live.status === "paused") {
        logger.info(`[processJob] ${jobId} pause detected at skip=${cursorSkip}`);
        await updateJob(db, jobId, {cursor: {skip: cursorSkip}});
        return;
      }

      const remaining = total - cursorSkip;
      const thisBatch = Math.min(batchSize, remaining);

      const payloads = await fetchBridgeBatch(job.filters, thisBatch, cursorSkip);
      if (payloads.length === 0) break;

      let added = 0;
      let updated = 0;
      let priceDrops = 0;
      let embedded = 0;
      let embeddingsSkipped = 0;
      let lastKey: string | null = null;

      for (const payload of payloads) {
        const result = await persistBridgeProperty(db, payload);
        if (result.isNew) added++; else updated++;
        if (result.priceDropped) priceDrops++;
        lastKey = result.persisted.ListingKey;

        const shouldEmbed = !(skipEmbeddingIfUnchanged && !result.isNew && !result.remarksChanged);
        if (shouldEmbed) {
          try {
            await embedAndStore(db, result.persisted);
            embedded++;
          } catch (embedErr: any) {
            logger.warn(`[processJob] embed skipped for ${result.persisted.ListingKey}: ${embedErr.message}`);
            embeddingsSkipped++;
          }
        } else {
          embeddingsSkipped++;
        }
      }

      cursorSkip += payloads.length;
      await updateJob(db, jobId, {
        processed: admin.firestore.FieldValue.increment(payloads.length) as any,
        added: admin.firestore.FieldValue.increment(added) as any,
        updated: admin.firestore.FieldValue.increment(updated) as any,
        priceDrops: admin.firestore.FieldValue.increment(priceDrops) as any,
        embedded: admin.firestore.FieldValue.increment(embedded) as any,
        embeddingsSkipped: admin.firestore.FieldValue.increment(embeddingsSkipped) as any,
        lastListingKey: lastKey,
        cursor: {skip: cursorSkip},
      });

      if (payloads.length < thisBatch) break;
      await sleep(INTER_BATCH_DELAY_MS);
    }

    const finished = await readJob(db, jobId);
    const durationMs = Date.now() - startedAtMs;
    await updateJob(db, jobId, {
      status: "done" as SyncJobStatus,
      finishedAt: admin.firestore.FieldValue.serverTimestamp() as any,
    });

    if (finished?.parentJobId) {
      await maybeStartNextSibling(db, finished.parentJobId);
    }

    if (finished) {
      await notifyJobCompleted(db, jobId, finished, durationMs);
    }
  } catch (err: any) {
    logger.error(`[processJob] ${jobId} error:`, err);
    const snap = await readJob(db, jobId);
    await updateJob(db, jobId, {
      status: "error" as SyncJobStatus,
      error: err.message || "Unknown error",
      finishedAt: admin.firestore.FieldValue.serverTimestamp() as any,
    });
    if (snap) await notifyJobError(db, jobId, snap, err.message || "Unknown error");
  }
}
