import { PropertyProps } from '../../domain/Property';
import { BridgePropertyPayload } from '../dto/BridgeDTOs';

export class BridgePropertyMapper {
    /**
     * Converts a Bridge RESO Web API payload into the format expected by the `Property` entity.
     * Since Property now adheres to the RESO standard, mapping is almost 1-to-1.
     */
    static toDomainProps(bridgeProperty: BridgePropertyPayload): Omit<PropertyProps, 'createdAt' | 'updatedAt'> {
        return {
            ListingKey: bridgeProperty.ListingKey,
            ListingId: bridgeProperty.ListingId,
            StandardStatus: bridgeProperty.StandardStatus || 'Unknown',
            PropertyType: bridgeProperty.PropertyType || 'Unknown',
            PropertySubType: bridgeProperty.PropertySubType,
            ListPrice: bridgeProperty.ListPrice || bridgeProperty.ClosePrice || 0,
            ClosePrice: bridgeProperty.ClosePrice,
            AssociationFee: bridgeProperty.AssociationFee,
            BedroomsTotal: bridgeProperty.BedroomsTotal || 0,
            BathroomsTotalInteger: bridgeProperty.BathroomsTotalInteger || 0,
            LivingArea: bridgeProperty.LivingArea || bridgeProperty.BuildingAreaTotal || 0,
            LotSizeAcres: bridgeProperty.LotSizeAcres,
            YearBuilt: bridgeProperty.YearBuilt,
            UnparsedAddress: bridgeProperty.UnparsedAddress || 'Unknown Address',
            City: bridgeProperty.City || 'Unknown City',
            StateOrProvince: bridgeProperty.StateOrProvince,
            PostalCode: bridgeProperty.PostalCode,
            Latitude: bridgeProperty.Latitude,
            Longitude: bridgeProperty.Longitude,
            Media: bridgeProperty.Media?.sort((a, b) => (a.Order || 0) - (b.Order || 0))
                .map(m => m.MediaURL)
                .filter((url): url is string => !!url) || [],
            PublicRemarks: bridgeProperty.PublicRemarks || 'No description available.',
            
            HOAFee: bridgeProperty.HOAFee,
            TaxAnnualAmount: bridgeProperty.TaxAnnualAmount,
            PoolPrivateYN: bridgeProperty.PoolPrivateYN || false,
            WaterfrontYN: bridgeProperty.WaterfrontYN || false,
            Cooling: bridgeProperty.Cooling || [],
            Heating: bridgeProperty.Heating || [],
            Appliances: bridgeProperty.Appliances || [],
            GarageSpaces: bridgeProperty.GarageSpaces || 0,
            DaysOnMarket: bridgeProperty.DaysOnMarket,
            ArchitecturalStyle: bridgeProperty.ArchitecturalStyle || [],
            View: bridgeProperty.View || [],
            AssociationAmenities: bridgeProperty.AssociationAmenities || []
        } as any;
    }
}
