import { z } from "zod";

export const HOME_SECTIONS = ['featured', 'luxury', 'waterfront', 'new-today', 'investor-deals'] as const;
export const HomeSectionSchema = z.enum(HOME_SECTIONS);
export type HomeSection = z.infer<typeof HomeSectionSchema>;

export const HOME_SECTION_LABELS: Record<HomeSection, { label: string; description: string }> = {
    'featured': { label: 'Featured', description: 'Destacadas en la home principal' },
    'luxury': { label: 'Luxury', description: 'Propiedades de lujo' },
    'waterfront': { label: 'Waterfront', description: 'Frente al agua' },
    'new-today': { label: 'New Today', description: 'Recién incorporadas' },
    'investor-deals': { label: 'Investor Deals', description: 'Oportunidades de inversión' },
};

export const PropertySchema = z.object({
    ListingKey: z.string().optional(), // optional for creation
    ListingId: z.string().optional(),
    slug: z.string().optional(),

    StandardStatus: z.string().min(1, "Status is required"),
    PropertyType: z.string().min(1, "Property Type is required"),
    PropertySubType: z.string().optional(),

    ListPrice: z.number().min(0, "Price must be positive"),
    ClosePrice: z.number().optional(),
    AssociationFee: z.number().optional(),

    BedroomsTotal: z.number().min(0),
    BathroomsTotalInteger: z.number().min(0),
    LivingArea: z.number().min(0),
    LotSizeAcres: z.number().optional(),
    YearBuilt: z.number().optional(),

    UnparsedAddress: z.string().min(1, "Address is required"),
    City: z.string().min(1, "City is required"),
    StateOrProvince: z.string().optional(),
    PostalCode: z.string().optional(),
    Latitude: z.number().optional(),
    Longitude: z.number().optional(),

    Media: z.array(z.string()).default([]),
    ExteriorFeatures: z.array(z.string()).default([]),
    PublicRemarks: z.string().default(""),

    videoUrl: z.string().url().optional().or(z.literal("")),
    virtualTourUrl: z.string().url().optional().or(z.literal("")),
    agentId: z.string().optional(),
    views: z.number().optional(),
    petsAllowed: z.boolean().optional(),

    opportunityScore: z.number().optional(),
    listingQualityScore: z.number().optional(),
    marketStatus: z.enum(['normal', 'distressed', 'price_drop', 'back_on_market']).optional(),
    investmentAnalysis: z.object({
        cashFlow: z.number().optional(),
        roi: z.number().optional(),
        capRate: z.number().optional(),
        description: z.string().optional()
    }).optional(),

    homeSections: z.array(HomeSectionSchema).optional(),
    editorialNotes: z.string().optional(),
    curatedAt: z.number().optional(),
    curatedBy: z.string().optional(),

    archived: z.boolean().optional(),
    archivedAt: z.number().optional(),

    createdAt: z.number().optional(),
    updatedAt: z.number().optional()
});

export type PropertySchemaType = z.infer<typeof PropertySchema>;
