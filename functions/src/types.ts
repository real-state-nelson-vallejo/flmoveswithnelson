// Shared types used by the worker. Kept self-contained: the worker does NOT
// import anything from ../../src to avoid cross-package tsconfig pain.

export interface AdvancedPropertyFilters {
  zones?: string[];
  counties?: string[];
  minBeds?: number;
  minBaths?: number;
  maxPrice?: number;
  propertyType?: string;
  propertySubTypes?: string[];
  waterfront?: boolean;
  hasPool?: boolean;
  minSqFt?: number;
  agentId?: string;
  officeId?: string;
  spatialBox?: {latMin: number; latMax: number; lngMin: number; lngMax: number};
}

export interface BridgePayload {
  ListingKey: string;
  ListingId?: string;
  UnparsedAddress?: string;
  City?: string;
  StateOrProvince?: string;
  PostalCode?: string;
  Latitude?: number;
  Longitude?: number;
  ListPrice?: number;
  ClosePrice?: number;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  BuildingAreaTotal?: number;
  PropertyType?: string;
  PropertySubType?: string;
  StandardStatus?: string;
  PublicRemarks?: string;
  Media?: Array<{Order?: number; MediaURL?: string} | string>;
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  TaxAnnualAmount?: number;
  AssociationFee?: number;
  DaysOnMarket?: number;
  YearBuilt?: number;
  ArchitecturalStyle?: string[];
  AssociationAmenities?: string[];
  Cooling?: string[];
  Heating?: string[];
  Appliances?: string[];
  GarageSpaces?: number;
  ModificationTimestamp?: string;
  ListAgentMlsId?: string;
  ListAgentFullName?: string;
  ListOfficeMlsId?: string;
  LotSizeAcres?: number;
}

export interface PropertyPersistenceModel {
  ListingKey: string;
  ListingId?: string;
  slug?: string;
  StandardStatus: string;
  PropertyType: string;
  PropertySubType?: string;
  ListPrice: number;
  ClosePrice?: number;
  AssociationFee?: number;
  BedroomsTotal: number;
  BathroomsTotalInteger: number;
  LivingArea: number;
  LotSizeAcres?: number;
  YearBuilt?: number;
  UnparsedAddress: string;
  City: string;
  StateOrProvince?: string;
  PostalCode?: string;
  Latitude?: number;
  Longitude?: number;
  HOAFee?: number;
  TaxAnnualAmount?: number;
  PoolPrivateYN?: boolean;
  WaterfrontYN?: boolean;
  Cooling?: string[];
  Heating?: string[];
  Appliances?: string[];
  GarageSpaces?: number;
  DaysOnMarket?: number;
  ArchitecturalStyle?: string[];
  AssociationAmenities?: string[];
  Media: string[];
  PublicRemarks: string;
  videoUrl?: string;
  virtualTourUrl?: string;
  agentId?: string;
  views?: number;
  petsAllowed?: boolean;
  ListAgentMlsId?: string;
  ListOfficeMlsId?: string;
  opportunityScore?: number;
  listingQualityScore?: number;
  marketStatus?: "normal" | "distressed" | "price_drop" | "back_on_market";

  // Editorial tagging (Fase 4)
  homeSections?: Array<"featured" | "luxury" | "waterfront" | "new-today" | "investor-deals">;
  editorialNotes?: string;
  curatedAt?: number;
  curatedBy?: string;

  // Archive flag (Fase 6)
  archived?: boolean;
  archivedAt?: number;

  createdAt: number;
  updatedAt: number;
  externalId?: string;
}

export type SyncJobStatus = "pending" | "queued" | "processing" | "paused" | "done" | "error";

export interface SyncJobDoc {
  filters: AdvancedPropertyFilters;
  mode: "quality" | "fast";
  status: SyncJobStatus;
  total: number | null;
  processed: number;
  added: number;
  updated: number;
  skipped: number;
  priceDrops: number;
  embedded: number;
  embeddingsSkipped: number;
  lastListingKey: string | null;
  cursor: {skip: number};
  batchSize: number;
  label?: string;
  parentJobId?: string;
  order?: number;
  limitCap?: number | null;
  startedAt?: FirebaseFirestore.Timestamp;
  finishedAt?: FirebaseFirestore.Timestamp;
  error?: string | null;
  createdBy?: string;
  createdByEmail?: string | null;
}
