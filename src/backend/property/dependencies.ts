import { FirestorePropertyRepository } from "./infrastructure/FirestorePropertyRepository";
import { GenkitContentGenerator } from "./infrastructure/GenkitContentGenerator";

// Dependency Injection Container
const propertyRepository = new FirestorePropertyRepository();
const contentGenerator = new GenkitContentGenerator();

export const propertyDependencies = {
    propertyRepository,
    contentGenerator,
};
