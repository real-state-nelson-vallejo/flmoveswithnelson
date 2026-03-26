import { ContentGenerator, AnalysisResult } from "../domain/ContentGenerator";
import { PropertyRepository } from "../domain/PropertyRepository";

export class AnalyzeProperty {
    constructor(
        private readonly propertyRepository: PropertyRepository,
        private readonly contentGenerator: ContentGenerator
    ) { }

    async execute(propertyId: string): Promise<AnalysisResult> {
        const property = await this.propertyRepository.findById(propertyId);
        if (!property) {
            throw new Error("Property not found");
        }

        // Prepare data for analysis
        // Prepare data for analysis using DTO adapter to preserve Generator contract
        const data = property.toDTO();

        const analysis = await this.contentGenerator.analyzeProperty(data);

        // Update property with analysis results
        property.update({
            opportunityScore: analysis.opportunityScore,
            listingQualityScore: analysis.listingQualityScore,
            marketStatus: analysis.marketStatus,
            investmentAnalysis: analysis.investmentAnalysis
        });

        await this.propertyRepository.save(property);

        return analysis;
    }
}
