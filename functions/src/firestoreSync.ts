import * as admin from "firebase-admin";
import {BridgePayload, PropertyPersistenceModel} from "./types.js";

const COLLECTION = "properties";

function mapToPersistence(p: BridgePayload): PropertyPersistenceModel {
  const media: string[] = Array.isArray(p.Media)
    ? (p.Media as Array<{Order?: number; MediaURL?: string} | string>)
      .slice()
      .sort((a, b) => {
        const ao = typeof a === "object" ? (a.Order ?? 0) : 0;
        const bo = typeof b === "object" ? (b.Order ?? 0) : 0;
        return ao - bo;
      })
      .map((m) => (typeof m === "string" ? m : (m.MediaURL ?? "")))
      .filter(Boolean) as string[]
    : [];

  const now = Date.now();
  const baseSlug = (p.UnparsedAddress || "property")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`;

  const model: PropertyPersistenceModel = {
    ListingKey: p.ListingKey,
    slug,
    StandardStatus: p.StandardStatus || "Active",
    PropertyType: p.PropertyType || "Unknown",
    ListPrice: p.ListPrice ?? p.ClosePrice ?? 0,
    BedroomsTotal: p.BedroomsTotal ?? 0,
    BathroomsTotalInteger: p.BathroomsTotalInteger ?? 0,
    LivingArea: p.LivingArea ?? p.BuildingAreaTotal ?? 0,
    UnparsedAddress: p.UnparsedAddress || "",
    City: p.City || "",
    Media: media,
    PublicRemarks: p.PublicRemarks || "",
    // Defaults required by Fase 4/6 queries: every synced prop is indexable by
    // archived (for public listing filter) and has an empty homeSections array
    // so array-contains queries work without null checks.
    homeSections: [],
    archived: false,
    createdAt: now,
    updatedAt: now,
    externalId: p.ListingKey,
  };

  if (p.ListingId !== undefined) model.ListingId = p.ListingId;
  if (p.PropertySubType !== undefined) model.PropertySubType = p.PropertySubType;
  if (p.ClosePrice !== undefined) model.ClosePrice = p.ClosePrice;
  if (p.AssociationFee !== undefined) model.AssociationFee = p.AssociationFee;
  if (p.LotSizeAcres !== undefined) model.LotSizeAcres = p.LotSizeAcres;
  if (p.YearBuilt !== undefined) model.YearBuilt = p.YearBuilt;
  if (p.StateOrProvince !== undefined) model.StateOrProvince = p.StateOrProvince;
  if (p.PostalCode !== undefined) model.PostalCode = p.PostalCode;
  if (p.Latitude !== undefined) model.Latitude = p.Latitude;
  if (p.Longitude !== undefined) model.Longitude = p.Longitude;
  if (p.TaxAnnualAmount !== undefined) model.TaxAnnualAmount = p.TaxAnnualAmount;
  if (p.PoolPrivateYN !== undefined) model.PoolPrivateYN = p.PoolPrivateYN;
  if (p.WaterfrontYN !== undefined) model.WaterfrontYN = p.WaterfrontYN;
  if (p.Cooling !== undefined) model.Cooling = p.Cooling;
  if (p.Heating !== undefined) model.Heating = p.Heating;
  if (p.Appliances !== undefined) model.Appliances = p.Appliances;
  if (p.GarageSpaces !== undefined) model.GarageSpaces = p.GarageSpaces;
  if (p.DaysOnMarket !== undefined) model.DaysOnMarket = p.DaysOnMarket;
  if (p.ArchitecturalStyle !== undefined) model.ArchitecturalStyle = p.ArchitecturalStyle;
  if (p.AssociationAmenities !== undefined) model.AssociationAmenities = p.AssociationAmenities;
  if (p.ListAgentMlsId !== undefined) model.ListAgentMlsId = p.ListAgentMlsId;
  if (p.ListOfficeMlsId !== undefined) model.ListOfficeMlsId = p.ListOfficeMlsId;

  return model;
}

export interface PersistResult {
  persisted: PropertyPersistenceModel;
  isNew: boolean;
  priceDropped: boolean;
  remarksChanged: boolean;
  docId: string;
}

export async function findByExternalId(db: admin.firestore.Firestore, externalId: string): Promise<{id: string; data: PropertyPersistenceModel} | null> {
  // Fast path: every property we persist uses doc ID = ListingKey = externalId.
  // Point read is O(1) instead of a collection scan (dedupe in a sync of 10K props
  // goes from ~100M reads to 10K reads).
  const directDoc = await db.collection(COLLECTION).doc(externalId).get();
  if (directDoc.exists) {
    return {id: directDoc.id, data: directDoc.data() as PropertyPersistenceModel};
  }

  // Legacy fallback for props created by older pipelines with random doc IDs.
  const snap = await db.collection(COLLECTION)
    .where("externalId", "==", externalId)
    .limit(1)
    .get();
  if (snap.empty || !snap.docs[0]) return null;
  const doc = snap.docs[0];
  return {id: doc.id, data: doc.data() as PropertyPersistenceModel};
}

export async function persistBridgeProperty(
  db: admin.firestore.Firestore,
  payload: BridgePayload,
): Promise<PersistResult> {
  const incoming = mapToPersistence(payload);
  const existing = await findByExternalId(db, payload.ListingKey);

  // Auto-archive: if Bridge returns a non-Active status, flip archived on.
  // Conversely, if it was archived and is Active again, un-archive (back_on_market).
  const incomingIsActive = incoming.StandardStatus === "Active";

  if (!existing) {
    // Create uses mapToPersistence which sets archived: false. If the incoming
    // status is non-Active (which is rare on a fresh sync since we filter by
    // Active in Bridge, but possible in `getModifiedPropertiesSince`), archive it.
    if (!incomingIsActive) {
      incoming.archived = true;
      incoming.archivedAt = Date.now();
    }
    await db.collection(COLLECTION).doc(incoming.ListingKey).set(incoming);
    return {persisted: incoming, isNew: true, priceDropped: false, remarksChanged: true, docId: incoming.ListingKey};
  }

  const prev = existing.data;
  const priceDropped = (incoming.ListPrice || 0) < (prev.ListPrice || 0);
  const remarksChanged = (prev.PublicRemarks || "") !== (incoming.PublicRemarks || "");

  const merged: PropertyPersistenceModel = {
    ...prev,
    ListPrice: incoming.ListPrice,
    StandardStatus: incoming.StandardStatus,
    Media: incoming.Media,
    PublicRemarks: incoming.PublicRemarks,
    updatedAt: Date.now(),
  };
  if (incoming.ListAgentMlsId !== undefined) merged.ListAgentMlsId = incoming.ListAgentMlsId;
  if (incoming.ListOfficeMlsId !== undefined) merged.ListOfficeMlsId = incoming.ListOfficeMlsId;

  // Reflect status-driven archive flag on the merged doc.
  if (!incomingIsActive && prev.archived !== true) {
    merged.archived = true;
    merged.archivedAt = Date.now();
  } else if (incomingIsActive && prev.archived === true) {
    merged.archived = false;
    // Keep the original archivedAt as audit trail of the last archive cycle.
  }

  await db.collection(COLLECTION).doc(existing.id).set(merged, {merge: true});

  return {persisted: merged, isNew: false, priceDropped, remarksChanged, docId: existing.id};
}
