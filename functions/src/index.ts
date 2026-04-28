import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {processJob} from "./processJob.js";
import {BRIDGE_SERVER_TOKEN, BRIDGE_DATASET} from "./bridge.js";
import {GEMINI_API_KEY} from "./embeddings.js";
import {ADMIN_NOTIFICATION_EMAIL, REVALIDATE_SECRET, NEXT_PUBLIC_URL} from "./notify.js";
export {onPropertyWrite} from "./onPropertyWrite.js";

admin.initializeApp();

setGlobalOptions({
  region: "us-central1",
  maxInstances: 10,
});

// Firestore-triggered functions cap at 540s. For longer jobs the worker
// self-reschedules by flipping its status to 'pending' before the budget
// runs out (see processJob.ts), which re-fires the onSyncJobUpdated trigger.
const RUNTIME_OPTS = {
  region: "us-central1",
  timeoutSeconds: 540,
  memory: "1GiB" as const,
  secrets: [
    BRIDGE_SERVER_TOKEN,
    BRIDGE_DATASET,
    GEMINI_API_KEY,
    ADMIN_NOTIFICATION_EMAIL,
    REVALIDATE_SECRET,
    NEXT_PUBLIC_URL,
  ],
};

/**
 * Triggered when a new syncJobs document is created by /api/sync/run.
 * Picks up pending jobs (including the first of a split) and processes them end-to-end.
 * Queued siblings wait; their status flips to 'pending' when the previous one finishes.
 */
export const onSyncJobCreated = onDocumentCreated(
  {
    document: "syncJobs/{jobId}",
    ...RUNTIME_OPTS,
  },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const data = snap.data();
    const jobId = event.params.jobId;

    if (data.isParent) {
      logger.info(`[onSyncJobCreated] ${jobId} is a parent aggregator, skipping.`);
      return;
    }
    if (data.status !== "pending") {
      logger.info(`[onSyncJobCreated] ${jobId} status=${data.status}, skipping.`);
      return;
    }
    await processJob(jobId);
  },
);

/**
 * Triggered when an existing job transitions to 'pending' again — used for:
 *   - resume after pause (paused → pending),
 *   - sequencing split sub-jobs (queued → pending).
 */
export const onSyncJobUpdated = onDocumentUpdated(
  {
    document: "syncJobs/{jobId}",
    ...RUNTIME_OPTS,
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const jobId = event.params.jobId;

    if (!before || !after) return;
    if (after.isParent) return;
    if (before.status === "pending" || after.status !== "pending") return;

    logger.info(`[onSyncJobUpdated] ${jobId} transitioned ${before.status} → pending`);
    await processJob(jobId);
  },
);
