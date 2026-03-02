import { Property } from "@/backend/property/domain/Property";
import { TransactionPreset } from "./TransactionPreset";

export interface FieldOverride {
    fieldId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    reason: string;
}

export class LogicEngine {
    static evaluate(property: Property, preset?: TransactionPreset | null): Record<string, any> {
        const overrides: Record<string, any> = {};

        // 1. Apply Preset Defaults (Base Layer)
        // Presets are explicit user choices, so they should generally override generic AI.
        // However, "Hard Legal Rules" (Level 2) should override Presets if they conflict 
        // (though usually Presets are for preferences, not facts).
        if (preset && preset.defaultData) {
            Object.assign(overrides, preset.defaultData);
        }

        // 2. Apply Hard Legal Logic (The "Logic Engine" proper)

        // Rule: Lead-Based Paint Disclosure
        // Requirement: Properties built prior to 1978.
        const yearBuilt = property.specs.yearBuilt;
        if (yearBuilt && yearBuilt < 1978) {
            // We need to know the specific field IDs from the templates. 
            // unique_id mapping from FieldMap:
            // ERL-14 uses: "lead_based_paint_disclosure" (hypothetically, need to check maps)
            // RLHD-3x uses: "lead_paint_checkbox"

            // Since field IDs might vary across templates, we ideally need a "Canonical Field Name" system.
            // For now, we will set common variations found in our analysis.
            overrides['lead_paint_disclosure'] = true;
            overrides['lead_based_paint_addendum'] = true;
            overrides['built_prior_1978'] = true;
        } else if (yearBuilt && yearBuilt >= 1978) {
            overrides['lead_paint_disclosure'] = false;
            overrides['lead_based_paint_addendum'] = false;
            overrides['built_prior_1978'] = false;
        }

        // Rule: HOA Addendum
        // If HOA fee exists > 0
        if (property.hoa && property.hoa.amount > 0) {
            overrides['hoa_addendum'] = true;
            overrides['association_fee'] = property.hoa.amount.toString();
            overrides['association_period'] = property.hoa.period;
        }

        return overrides;
    }
}
