export interface ContentGenerator {
    generatePropertyDescription(data: {
        title: string;
        location: string;
        features: string[];
        specs: { beds: number; baths: number; area: number };
        type: string;
    }): Promise<string>;
    analyzeProperty(data: any, rentCastData?: any): Promise<AnalysisResult>;
}

export interface AnalysisResult {
    opportunityScore: number;
    listingQualityScore: number;
    marketStatus: 'normal' | 'distressed' | 'price_drop' | 'back_on_market';
    investmentAnalysis: {
        cashFlow: number;
        roi: number;
        capRate: number;
        description: string;
    };
}
