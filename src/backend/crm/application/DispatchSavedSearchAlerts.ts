import { SavedSearchRepository } from "../domain/SavedSearchRepository";
import { Property } from "@/backend/property/domain/Property";
import { emailDependencies } from "@/backend/email/dependencies";
import { adminDb } from "@/lib/firebase/admin";
import { PropertyFilter } from "@/backend/property/domain/PropertyRepository";

export class DispatchSavedSearchAlerts {
    constructor(private savedSearchRepo: SavedSearchRepository) {}

    async execute(properties: Property[]): Promise<void> {
        if (!properties || properties.length === 0) return;

        const activeSearches = await this.savedSearchRepo.findAllActive();
        if (activeSearches.length === 0) return;

        // Group matches by Lead ID
        const leadMatches = new Map<string, Property[]>();

        for (const search of activeSearches) {
            const matches = properties.filter(p => this.matchesCriteria(p, search.searchCriteria));
            if (matches.length > 0) {
                const existing = leadMatches.get(search.leadId) || [];
                // Ensure no duplicate properties for the same lead (if they have multiple overlapping searches)
                for (const m of matches) {
                    if (!existing.find(e => e.id === m.id)) {
                        existing.push(m);
                    }
                }
                leadMatches.set(search.leadId, existing);
            }
        }

        // Dispatch emails to each lead
        for (const [leadId, matchedProperties] of leadMatches.entries()) {
            await this.dispatchEmailToLead(leadId, matchedProperties);
        }
    }

    private matchesCriteria(p: Property, filter: PropertyFilter): boolean {
        const query = filter.query?.toLowerCase();
        
        // Exact city / zip / text match if query is provided
        if (query) {
            const matchesText = 
                (p.UnparsedAddress || '').toLowerCase().includes(query) ||
                (p.City || '').toLowerCase().includes(query) ||
                (p.PostalCode || '').toLowerCase().includes(query);
            if (!matchesText) return false;
        }

        if (filter.minPrice && (p.ListPrice || 0) < filter.minPrice) return false;
        if (filter.maxPrice && (p.ListPrice || 0) > filter.maxPrice) return false;
        if (filter.minBeds && (p.BedroomsTotal || 0) < filter.minBeds) return false;
        
        // If type filter translates directly (Basic simulation for now)
        if (filter.type) {
            const filterType = filter.type.toLowerCase();
            const dbType = (p.PropertyType || '').toLowerCase();
            if (filterType === 'sale' && dbType.includes('lease')) return false;
            if (filterType === 'rent' && !dbType.includes('lease')) return false;
        }

        return true;
    }

    private async dispatchEmailToLead(leadId: string, properties: Property[]): Promise<void> {
        try {
            const doc = await adminDb.collection('leads').doc(leadId).get();
            if (!doc.exists) return;
            const leadData = doc.data();
            if (!leadData?.email) return;

            const html = this.buildEmailHTML(leadData.name, properties);
            
            await emailDependencies.sendEmail.execute(
                leadData.email,
                "⭐ New MLS Properties matched your smart search!",
                { text: `We found ${properties.length} new opportunities...`, html }
            );
            
            console.log(`[DispatchSavedSearchAlerts] Dispatched email to ${leadData.email} with ${properties.length} matches.`);
        } catch (error) {
            console.error(`[DispatchSavedSearchAlerts] Failed to send email to lead ${leadId}:`, error);
        }
    }

    private buildEmailHTML(name: string, properties: Property[]): string {
        const formatPrice = (p: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(p);
        
        let propertiesHtml = properties.slice(0, 5).map(p => `
            <div style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
                ${p.Media && p.Media.length > 0 ? `<img src="${p.Media[0]}" style="width: 100%; height: 200px; object-fit: cover;" />` : ''}
                <div style="padding: 16px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #0f172a;">${formatPrice(p.ListPrice || 0)}</h3>
                    <p style="margin: 0; color: #475569;">${p.UnparsedAddress}</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #64748b;">${p.BedroomsTotal} Beds • ${p.BathroomsTotalInteger} Baths • ${p.LivingArea} sqft</p>
                    <a href="https://flmoveswithnelson.com/en/properties/${p.slug}" style="display: inline-block; margin-top: 16px; background: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Details</a>
                </div>
            </div>
        `).join("");

        if (properties.length > 5) {
            propertiesHtml += `<p style="text-align: center; color: #64748b;">...and ${properties.length - 5} more matching opportunities.</p>`;
        }

        return `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #0f172a; margin-top: 0;">Hi ${name},</h2>
                <p style="color: #475569; font-size: 16px; line-height: 1.5;">We just found <strong>${properties.length}</strong> new properties on the MLS that perfectly match the criteria you saved.</p>
                <div style="margin-top: 30px;">
                    ${propertiesHtml}
                </div>
                <p style="color: #475569; font-size: 14px; margin-top: 40px; text-align: center;">
                    To stop receiving these alerts, you can update your preferences from your dashboard.
                </p>
            </div>
        `;
    }
}
