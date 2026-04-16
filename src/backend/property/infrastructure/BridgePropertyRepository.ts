import { Property } from '../domain/Property';
import { BridgeAPIClient } from './BridgeAPIClient';
import { BridgePropertyMapper } from './mappers/BridgePropertyMapper';
import { BridgePropertyPayload } from './dto/BridgeDTOs';

export interface AdvancedPropertyFilters {
    zones?: string[]; // Zips or Cities
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
    spatialBox?: { latMin: number; latMax: number; lngMin: number; lngMax: number };
}

export class BridgePropertyRepository {
    constructor(private readonly bridgeClient = new BridgeAPIClient()) {}

    private buildODataQuery(filters: AdvancedPropertyFilters): { filter: string, near?: string } {
        const filterParts = [`StandardStatus eq 'Active'`];

        if (filters.zones && filters.zones.length > 0) {
            const zoneQueries = filters.zones.map(z => {
                const zFormatted = z.trim();
                const isZip = /^\d+$/.test(zFormatted); 
                if(isZip) return `PostalCode eq '${zFormatted}'`;
                return `toupper(City) eq '${zFormatted.toUpperCase()}'`;
            });
            filterParts.push(`(${zoneQueries.join(' or ')})`);
        } else if ((filters as any).zone) { // Backwards compatibility for old calls
            const oldZone = (filters as any).zone;
            const zUppercase = oldZone.toUpperCase();
            filterParts.push(`(toupper(City) eq '${zUppercase}' or PostalCode eq '${oldZone}')`);
        }

        if (filters.counties && filters.counties.length > 0) {
            const countyQueries = filters.counties.map(c => `toupper(CountyOrParish) eq '${c.trim().toUpperCase()}'`);
            filterParts.push(`(${countyQueries.join(' or ')})`);
        }

        if (filters.propertySubTypes && filters.propertySubTypes.length > 0) {
            const typeQueries = filters.propertySubTypes.map(t => `PropertySubType eq '${t.trim()}'`);
            filterParts.push(`(${typeQueries.join(' or ')})`);
        }

        if (filters.minBeds) filterParts.push(`BedroomsTotal ge ${filters.minBeds}`);
        if (filters.minBaths) filterParts.push(`BathroomsTotalInteger ge ${filters.minBaths}`);
        if (filters.maxPrice) filterParts.push(`ListPrice le ${filters.maxPrice}`);
        if (filters.propertyType) filterParts.push(`PropertyType eq '${filters.propertyType}'`);
        
        if (filters.waterfront) filterParts.push(`WaterfrontYN eq true`);
        if (filters.hasPool) filterParts.push(`PoolPrivateYN eq true`);
        if (filters.minSqFt) filterParts.push(`LivingArea ge ${filters.minSqFt}`);

        if (filters.agentId) filterParts.push(`ListAgentMlsId eq '${filters.agentId}'`);
        if (filters.officeId) filterParts.push(`ListOfficeMlsId eq '${filters.officeId}'`);
        
        if (filters.spatialBox) {
            filterParts.push(`Latitude ge ${filters.spatialBox.latMin} and Latitude le ${filters.spatialBox.latMax} and Longitude ge ${filters.spatialBox.lngMin} and Longitude le ${filters.spatialBox.lngMax}`);
        }

        const queryRes: { filter: string } = {
            filter: filterParts.join(' and ')
        };

        return queryRes;
    }

    async getActiveProperties(filters: AdvancedPropertyFilters = {}, limit: number = 20, skip: number = 0): Promise<{ property: Property, externalId: string }[]> {
        const { filter } = this.buildODataQuery(filters);
        const selectFields = "ListingKey,UnparsedAddress,City,StateOrProvince,PostalCode,ListPrice,BedroomsTotal,BathroomsTotalInteger,LivingArea,PropertyType,StandardStatus,PublicRemarks,Media,PoolPrivateYN,WaterfrontYN,TaxAnnualAmount,AssociationFee,DaysOnMarket,YearBuilt,ArchitecturalStyle,AssociationAmenities,Cooling,Heating,Appliances,GarageSpaces,ModificationTimestamp,ListAgentMlsId,ListAgentFullName,ListOfficeMlsId";

        const options: any = {
            filter,
            top: limit,
            skip,
            select: selectFields
        };

        const payloads = await this.bridgeClient.fetchProperties(options);

        return payloads.map((payload: BridgePropertyPayload) => {
            const props = BridgePropertyMapper.toDomainProps(payload);
            // Also return ListingKey so the UseCase knows if it should insert or update in Firestore
            return {
                property: Property.create(props),
                externalId: payload.ListingKey
            };
        });
    }

    /**
     * Reconstructs the exact search filter and asks Bridge for the total remote inventory counts.
     */
    async countActiveProperties(filters: AdvancedPropertyFilters = {}): Promise<number> {
        const { filter } = this.buildODataQuery(filters);

        const options: any = { filter };

        return this.bridgeClient.countProperties(options);
    }

    /**
     * Gets properties that have been modified after a certain date.
     * Used for the Delta Sync strategy via Cron Job.
     */
    async getModifiedPropertiesSince(date: Date, limit: number = 50, skip: number = 0): Promise<{ property: Property, externalId: string }[]> {
        const isoDate = date.toISOString();
        const selectFields = "ListingKey,UnparsedAddress,City,StateOrProvince,PostalCode,ListPrice,BedroomsTotal,BathroomsTotalInteger,LivingArea,PropertyType,StandardStatus,PublicRemarks,Media,PoolPrivateYN,WaterfrontYN,TaxAnnualAmount,AssociationFee,DaysOnMarket,YearBuilt,ArchitecturalStyle,AssociationAmenities,Cooling,Heating,Appliances,GarageSpaces,ModificationTimestamp,ListAgentMlsId,ListAgentFullName,ListOfficeMlsId";

        const filter = `ModificationTimestamp gt ${isoDate}`; // OData date filtering format might require adjusting
        const payloads = await this.bridgeClient.fetchProperties({
            filter,
            top: limit,
            skip,
            select: selectFields
        });

        return payloads.map((payload: BridgePropertyPayload) => {
            const props = BridgePropertyMapper.toDomainProps(payload);
            return {
                property: Property.create(props),
                externalId: payload.ListingKey
            };
        });
    }
}
