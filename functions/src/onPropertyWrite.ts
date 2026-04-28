import {onDocumentWritten} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {PropertyPersistenceModel} from "./types.js";

const STATS_COLLECTION = "stats";
const STATS_DOC = "properties";
const PROPERTIES_COLLECTION = "properties";

interface PropertyStatsDoc {
  total: number;
  active: number;
  archived: number;
  totalValue: number;
  byStatus: Record<string, number>;
  byCity: Record<string, number>;
  byAgent: Record<string, number>;
  updatedAt: FirebaseFirestore.FieldValue;
}

/**
 * Recalculates stats incrementally on every write to `properties`.
 * Kept in sync via FieldValue.increment() so there's no read amplification.
 * Uses `FieldValue.delete()` semantics via setting to 0 where needed (kept simple).
 */
export const onPropertyWrite = onDocumentWritten({
  document: `${PROPERTIES_COLLECTION}/{propertyId}`,
  region: "us-central1",
  timeoutSeconds: 60,
  memory: "256MiB",
}, async (event) => {
  const before = event.data?.before.exists ? (event.data.before.data() as PropertyPersistenceModel) : null;
  const after = event.data?.after.exists ? (event.data.after.data() as PropertyPersistenceModel) : null;

  const db = admin.firestore();
  const ref = db.collection(STATS_COLLECTION).doc(STATS_DOC);
  const FieldValue = admin.firestore.FieldValue;

  const update: Record<string, FirebaseFirestore.FieldValue | string | number> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  const incStatus = (status: string | undefined, delta: number) => {
    if (!status) return;
    update[`byStatus.${status}`] = FieldValue.increment(delta);
  };
  const incCity = (city: string | undefined, delta: number) => {
    if (!city) return;
    const key = sanitize(city);
    update[`byCity.${key}`] = FieldValue.increment(delta);
  };
  const incAgent = (agent: string | undefined, delta: number) => {
    if (!agent) return;
    update[`byAgent.${agent}`] = FieldValue.increment(delta);
  };

  if (!before && after) {
    // Create
    update.total = FieldValue.increment(1);
    update.totalValue = FieldValue.increment(after.ListPrice || 0);
    if (after.archived === true) update.archived = FieldValue.increment(1);
    if (after.StandardStatus === "Active" && after.archived !== true) update.active = FieldValue.increment(1);
    incStatus(after.StandardStatus, 1);
    incCity(after.City, 1);
    incAgent(after.ListAgentMlsId, 1);
  } else if (before && !after) {
    // Delete
    update.total = FieldValue.increment(-1);
    update.totalValue = FieldValue.increment(-(before.ListPrice || 0));
    if (before.archived === true) update.archived = FieldValue.increment(-1);
    if (before.StandardStatus === "Active" && before.archived !== true) update.active = FieldValue.increment(-1);
    incStatus(before.StandardStatus, -1);
    incCity(before.City, -1);
    incAgent(before.ListAgentMlsId, -1);
  } else if (before && after) {
    // Update — compute deltas for each aggregated axis.
    const priceDelta = (after.ListPrice || 0) - (before.ListPrice || 0);
    if (priceDelta !== 0) update.totalValue = FieldValue.increment(priceDelta);

    if (before.StandardStatus !== after.StandardStatus) {
      incStatus(before.StandardStatus, -1);
      incStatus(after.StandardStatus, 1);
    }
    if (before.City !== after.City) {
      incCity(before.City, -1);
      incCity(after.City, 1);
    }
    if (before.ListAgentMlsId !== after.ListAgentMlsId) {
      incAgent(before.ListAgentMlsId, -1);
      incAgent(after.ListAgentMlsId, 1);
    }

    const wasActive = before.StandardStatus === "Active" && before.archived !== true;
    const isActive = after.StandardStatus === "Active" && after.archived !== true;
    if (wasActive && !isActive) update.active = FieldValue.increment(-1);
    if (!wasActive && isActive) update.active = FieldValue.increment(1);

    const wasArchived = before.archived === true;
    const isArchived = after.archived === true;
    if (wasArchived && !isArchived) update.archived = FieldValue.increment(-1);
    if (!wasArchived && isArchived) update.archived = FieldValue.increment(1);
  }

  // Nothing to do if only timestamp changed or no axis moved.
  if (Object.keys(update).length === 1) return;

  try {
    await ref.set(update, {merge: true});
  } catch (err: any) {
    logger.error(`[onPropertyWrite] stats update failed: ${err.message}`);
  }
});

/** Firestore field paths can't contain `.`, `[`, `]`, `/`, `~`, `*` — swap them out. */
function sanitize(key: string): string {
  return key.replace(/[.~*/[\]]/g, "_");
}
