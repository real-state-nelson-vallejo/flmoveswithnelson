import { ContentGenerator } from "../domain/ContentGenerator";

export class GeneratePropertyDescription {
    constructor(private readonly generator: ContentGenerator) { }

    async execute(data: {
        title: string;
        location: string;
        features: string[];
        specs: { beds: number; baths: number; area: number };
        type: string;
    }): Promise<string> {
        return this.generator.generatePropertyDescription(data);
    }
}
