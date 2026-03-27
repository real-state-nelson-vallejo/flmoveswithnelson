import { Property } from '../domain/Property';
import { BridgeAPIClient } from './BridgeAPIClient';
import { BridgePropertyMapper } from './mappers/BridgePropertyMapper';
import { BridgePropertyPayload } from './dto/BridgeDTOs';

export class BridgePropertyRepository {
    constructor(private readonly bridgeClient = new BridgeAPIClient()) {}

    async getActiveProperties(filters: { zone?: string; minBeds?: number; maxPrice?: number; propertyType?: string; agentId?: string; officeId?: string } = {}, limit: number = 20, skip: number = 0): Promise<{ property: Property, externalId: string }[]> {
        const filterParts = [`StandardStatus eq 'Active'`];
        if (filters.zone) {
            const zUppercase = filters.zone.toUpperCase();
            filterParts.push(`(toupper(City) eq '${zUppercase}' or PostalCode eq '${filters.zone}')`);
        }
        if (filters.minBeds) {
            filterParts.push(`BedroomsTotal ge ${filters.minBeds}`);
        }
        if (filters.maxPrice) {
            filterParts.push(`ListPrice le ${filters.maxPrice}`);
        }
        if (filters.propertyType) {
            filterParts.push(`PropertyType eq '${filters.propertyType}'`);
        }
        if (filters.agentId) {
            filterParts.push(`ListAgentMlsId eq '${filters.agentId}'`);
        }
        if (filters.officeId) {
            filterParts.push(`ListOfficeMlsId eq '${filters.officeId}'`);
        }
        const filter = filterParts.join(' and ');
        const selectFields = "ListingKey,UnparsedAddress,City,StateOrProvince,PostalCode,ListPrice,BedroomsTotal,BathroomsTotalInteger,LivingArea,PropertyType,StandardStatus,PublicRemarks,Media,PoolPrivateYN,WaterfrontYN,TaxAnnualAmount,AssociationFee,DaysOnMarket,YearBuilt,ArchitecturalStyle,AssociationAmenities,Cooling,Heating,Appliances,GarageSpaces,ModificationTimestamp,ListAgentMlsId,ListAgentFullName,ListOfficeMlsId";

        const payloads = await this.bridgeClient.fetchProperties({
            filter,
            top: limit,
            skip,
            select: selectFields
        });

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
    async countActiveProperties(filters: { zone?: string; minBeds?: number; maxPrice?: number; propertyType?: string } = {}): Promise<number> {
        const filterParts = [`StandardStatus eq 'Active'`];
        if (filters.zone) {
            const zUppercase = filters.zone.toUpperCase();
            filterParts.push(`(toupper(City) eq '${zUppercase}' or PostalCode eq '${filters.zone}')`);
        }
        if (filters.minBeds) {
            filterParts.push(`BedroomsTotal ge ${filters.minBeds}`);
        }
        if (filters.maxPrice) {
            filterParts.push(`ListPrice le ${filters.maxPrice}`);
        }
        if (filters.propertyType) {
            filterParts.push(`PropertyType eq '${filters.propertyType}'`);
        }
        
        // Ensure Nelson's broader brokerage area filter if not restricted by UI
        const filter = filterParts.join(' and ');

        return this.bridgeClient.countProperties({ filter });
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
