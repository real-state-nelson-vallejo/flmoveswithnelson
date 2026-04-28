import {defineSecret} from "firebase-functions/params";
import {AdvancedPropertyFilters, BridgePayload} from "./types.js";

export const BRIDGE_SERVER_TOKEN = defineSecret("BRIDGE_SERVER_TOKEN");
export const BRIDGE_DATASET = defineSecret("BRIDGE_DATASET");

const BASE_URL = "https://api.bridgedataoutput.com/api/v2/OData";
const SELECT_FIELDS = [
  "ListingKey", "UnparsedAddress", "City", "StateOrProvince", "PostalCode",
  "Latitude", "Longitude", "ListPrice", "BedroomsTotal", "BathroomsTotalInteger",
  "LivingArea", "PropertyType", "PropertySubType", "StandardStatus", "PublicRemarks",
  "Media", "PoolPrivateYN", "WaterfrontYN", "TaxAnnualAmount", "AssociationFee",
  "DaysOnMarket", "YearBuilt", "ArchitecturalStyle", "AssociationAmenities",
  "Cooling", "Heating", "Appliances", "GarageSpaces", "ModificationTimestamp",
  "ListAgentMlsId", "ListAgentFullName", "ListOfficeMlsId", "LotSizeAcres",
].join(",");

function buildFilter(filters: AdvancedPropertyFilters): string {
  const parts: string[] = [`StandardStatus eq 'Active'`];

  if (filters.zones && filters.zones.length > 0) {
    const zoneQueries = filters.zones.map((z) => {
      const trimmed = z.trim();
      const isZip = /^\d+$/.test(trimmed);
      if (isZip) return `PostalCode eq '${trimmed}'`;
      return `toupper(City) eq '${trimmed.toUpperCase()}'`;
    });
    parts.push(`(${zoneQueries.join(" or ")})`);
  }

  if (filters.counties && filters.counties.length > 0) {
    const countyQueries = filters.counties.map((c) => `toupper(CountyOrParish) eq '${c.trim().toUpperCase()}'`);
    parts.push(`(${countyQueries.join(" or ")})`);
  }

  if (filters.propertySubTypes && filters.propertySubTypes.length > 0) {
    const typeQueries = filters.propertySubTypes.map((t) => `PropertySubType eq '${t.trim()}'`);
    parts.push(`(${typeQueries.join(" or ")})`);
  }

  if (filters.minBeds) parts.push(`BedroomsTotal ge ${filters.minBeds}`);
  if (filters.minBaths) parts.push(`BathroomsTotalInteger ge ${filters.minBaths}`);
  if (filters.maxPrice) parts.push(`ListPrice le ${filters.maxPrice}`);
  if (filters.propertyType) parts.push(`PropertyType eq '${filters.propertyType}'`);
  if (filters.waterfront) parts.push(`WaterfrontYN eq true`);
  if (filters.hasPool) parts.push(`PoolPrivateYN eq true`);
  if (filters.minSqFt) parts.push(`LivingArea ge ${filters.minSqFt}`);
  if (filters.agentId) parts.push(`ListAgentMlsId eq '${filters.agentId}'`);
  if (filters.officeId) parts.push(`ListOfficeMlsId eq '${filters.officeId}'`);

  if (filters.spatialBox) {
    const b = filters.spatialBox;
    parts.push(`Latitude ge ${b.latMin} and Latitude le ${b.latMax} and Longitude ge ${b.lngMin} and Longitude le ${b.lngMax}`);
  }

  return parts.join(" and ");
}

function resolveToken(): string {
  const t = process.env.BRIDGE_SERVER_TOKEN;
  if (!t) throw new Error("BRIDGE_SERVER_TOKEN not configured");
  return t;
}

function resolveDataset(): string {
  return process.env.BRIDGE_DATASET || "stellar";
}

export async function fetchBridgeBatch(
  filters: AdvancedPropertyFilters,
  top: number,
  skip: number,
): Promise<BridgePayload[]> {
  const url = new URL(`${BASE_URL}/${resolveDataset()}/Property`);
  url.searchParams.append("access_token", resolveToken());
  url.searchParams.append("$top", String(top));
  url.searchParams.append("$skip", String(skip));
  url.searchParams.append("$filter", buildFilter(filters));
  url.searchParams.append("$select", SELECT_FIELDS);

  const res = await fetch(url.toString(), {headers: {Accept: "application/json"}});
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const err = await res.json() as {error?: {message?: string}};
      msg = err?.error?.message || msg;
    } catch { /* ignore */ }
    throw new Error(`Bridge API ${res.status}: ${msg}`);
  }
  const data = await res.json() as {value?: BridgePayload[]};
  return data.value || [];
}

export async function countBridge(filters: AdvancedPropertyFilters): Promise<number> {
  const url = new URL(`${BASE_URL}/${resolveDataset()}/Property`);
  url.searchParams.append("access_token", resolveToken());
  url.searchParams.append("$top", "0");
  url.searchParams.append("$count", "true");
  url.searchParams.append("$filter", buildFilter(filters));
  const res = await fetch(url.toString(), {headers: {Accept: "application/json"}});
  if (!res.ok) return 0;
  const data = await res.json() as {"@odata.count"?: number};
  return data["@odata.count"] || 0;
}
